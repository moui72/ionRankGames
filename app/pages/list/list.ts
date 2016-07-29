import { Component } from '@angular/core';
import { NavController, NavParams, reorderArray, Alert } from 'ionic-angular';
import { Game } from '../../game.class';
import { List } from '../../list.class';
import { GameCompare } from '../../components/game-compare/game-compare';
import { UnrankedGame } from '../../components/unranked-game/unranked-game';
import { RankedGame } from '../../components/ranked-game/ranked-game';
import { Listdb } from '../../providers/listdb/listdb';
import { Data } from '../../providers/data/data';
import * as _ from 'lodash';

/*
  TODO: make list items use game components
  TODO: allow image toggling
 */

@Component({
  templateUrl: 'build/pages/list/list.html',
  directives: [GameCompare, UnrankedGame, RankedGame]
})
export class ListPage {
  list: List;
  challenger: Game;
  incumbent: Game;
  remainder: Game[];
  updatingH2H: boolean = false;
  updatingChallenger: boolean = false;

  constructor(private nav: NavController,
    private params: NavParams, private listdb: Listdb, private data: Data)
  {
    this.list = params.get('list');
    this.remainder = this.list.rankedSet;
    this.nextComparison();
  }

  save(){
    this.listdb.update(this.list);
  }
  sort(){
    this.list.set = _.sortBy(this.list.set, game => {
      return game.name;
    });
  }
  resetRankings(){
    this.list.rankedSet = [];
    this.nextComparison();
  }
  rankOf(game){
    let index = _.findIndex(this.list.rankedSet, fg => {
      fg.gameId == game.gameId;
    });
    return index > -1 ? index + 1 : index;
  }
  dragged(indices){
    this.list.rankedSet = reorderArray(this.list.rankedSet, indices);
    this.save();
  }
  append(game){
    this.list.rankedSet.push(game);
    this.save();
  }
  prepend(game){
    this.list.rankedSet.unshift(game);
    this.save();
  }
  drop(game){
    let confirm = Alert.create({
        title: 'Drop ' + game.name + ' from pool?',
        message: 'Remove ' + game.name + ' from the pool of games to be ranked? This can\'t be undone. To get it back you would have to start a new list.',
        buttons: [
          {
            text: 'Cancel',
            handler: data => {
            // TOAST? ('Cancel game drop');
            }
          },
          {
            text: 'Trash',
            handler: data => {
              if(this.rankOf(game))
              _.remove(this.list.set, game);
              if(game == this.challenger){
                this.challenger = this.getOne();
              }
              this.save();
            }
          }
        ]
      })
      this.nav.present(confirm);
  }

  unrank(game){
    // TOAST? ('unranking');
    let removed = _.remove(this.list.rankedSet, game);
    if(removed.length < 1){
      return false;
    }
    if(game == this.incumbent){
      // handle case where incumbent becomes unranked (get new incumbent)
      this.incumbent = this.getIncumbent();
    }
    this.sort();
    this.save();
    return true;
  }

  unrankedGames(){
    return _.differenceBy(this.list.set, this.list.rankedSet, 'gameId');
  }

  getOne(){
    return _.shuffle(this.unrankedGames()).pop();
  }

  getIncumbent(){
    return this.remainder[_.floor(this.remainder.length / 2)];
  }

  getRemainder(index: number, goUp: boolean){
    /*
      TOAST?
      ('Only ' + this.remainder.length + ' games remain to compare.');
      ('getting new comparison set, going ' + (goUp ? 'up' : 'down') + '.');
     */

    if(goUp){
      let size = this.remainder.length % 2 == 0 ? index : index + 1;
      // TOAST? ('dropping ' + size + ' from the right');
      return _.dropRight(this.remainder, size);
    }
    let size = index + 1;
    // TOAST? ('dropping ' + size + ' from the left');
    return _.drop(this.remainder, size);
  }

  nextComparison(){
    // TOAST? ('setting up new comparison...');
    this.updatingH2H = true;
    new Promise((resolve, reject) => {
      if(this.list.rankedSet.length < 1){
        this.append(this.getOne());
        this.remainder = this.list.rankedSet;
      }
      this.incumbent = this.getIncumbent();
      if (this.challenger == undefined ||
        _.indexOf(this.list.rankedSet, this.challenger) > -1)
      {
        this.updatingChallenger = true;
        this.challenger = this.getOne();
      }
      this.save();
      resolve(this.updatingChallenger);
    }).then(newChallenger => {
      _.delay(() => {
        this.updatingH2H = false;
        this.updatingChallenger = false;
      }, 300);
    })
  }

  choose(winner){
    /*
      TOAST?
      ('and the winner is... ' +
      (this.challenger == winner ? this.challenger.name +
      ', the challenger!' : this.incumbent.name + ', the incumbent.'));
    */

    let pivot = _.indexOf(this.remainder, this.incumbent);
    this.remainder = this.getRemainder(
      pivot,
      this.challenger == winner // challenger is winner? go up; else: go down
    );

    if (this.remainder.length < 1) {
      // no comparisons left to make, so insert the game
      let incumbentIndex = _.indexOf(this.list.rankedSet, this.incumbent);
      this.rank(
        this.challenger,
        this.challenger == winner ? incumbentIndex : incumbentIndex + 1
      );
    }
    // advance to next comparison
    this.nextComparison();
  }

  rank(game, index){
    // TOAST? ('inserting ' + game.name + ' at ' + index);
    this.list.rankedSet.splice(index, 0, game);
    this.remainder = this.list.rankedSet;
    return game;
  }

  incumbentRank(){
    return _.indexOf(this.list.rankedSet, this.incumbent) + 1;
  }

  addingGame(){
    var games = _.sortBy(_.differenceBy(this.data.games,
      this.list.set, game => {
        return game['gameId'];
      }), game => {
        return game.name;
      });
    let prompt = Alert.create({
      title: 'Add game(s) to pool',
      subTitle: 'Add games to the pool that you might have missed.',
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
          // TOAST? ('Cancel game add');
          }
        },
        {
          text: 'Add',
          handler: data => {
            for(const gameId of data){
              let game = _.find(games, game => {
                return gameId == game['gameId'];
              })
              this.list.set.push(game);
            }
            this.sort();
            this.save();
          }
        }
      ]
    });
    for (const game of games) {
      prompt.addInput({
        type: 'checkbox',
        value: game['gameId'],
        label: game['name']
      })
    }
    this.nav.present(prompt);
  }
  rename(){
    let prompt = Alert.create({
      title: 'Rename ' + this.list.name,
      subTitle: 'Assign a new name to this list.',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'new list name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
          // TOAST? ('Cancel rename list');
          }
        },
        {
          text: 'Rename',
          handler: data => {
            console.log(data);
            this.list.name = data.name;
            this.save();
          }
        }
      ]
    })
    this.nav.present(prompt);
  }
}
