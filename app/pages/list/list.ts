import { Component } from '@angular/core';
import { NavController, NavParams, reorderArray, Alert, Toast } from 'ionic-angular';
import { Game } from '../../game.class';
import { List } from '../../list.class';
import { GameCompare } from '../../components/game-compare/game-compare';
import { UnrankedGame } from '../../components/unranked-game/unranked-game';
import { RankedGame } from '../../components/ranked-game/ranked-game';
import { RankedGamesTextPage } from '../ranked-games-text/ranked-games-text';
import { Listdb } from '../../providers/listdb/listdb';
import { Data } from '../../providers/data/data';
import * as _ from 'lodash';
import * as fileSaver from 'file-saver'

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
  promptDrops = true;
  logging = true;

  constructor(private nav: NavController,
    private params: NavParams, private listdb: Listdb, private data: Data)
  {
    this.list = params.get('list');
    let now = Date.now();
    if(typeof this.list.lastEdit == 'undefined'
    || !this.list.lastEdit || this.list.lastEdit < now){
      this.list.lastEdit = now;
    }
    this.resetComparisons();
  }

  resetComparisons(){
    if(this.list.set.length > this.list.rankedSet.length){
      this.remainder = this.list.rankedSet;
      this.incumbent = this.getIncumbent();
      this.challenger = this.challenger || this.getOne();
      this.nextComparison();
    }
  }

  getText(showList){
    this.nav.push(RankedGamesTextPage, {list: showList});
  }

  exportJSON(list){
    let json = JSON.stringify(list);
    let blob = new Blob([json], {type: "text/plain;charset=utf-8"});
    fileSaver.saveAs(blob, 'rg_' +
      this.list.name.replace(/\W+/g, '-').replace(/(\W+$|^\W+)/g, '') + '_ls.json');
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
    let prompt = Alert.create({
      title: 'Reset rankings?',
      message: 'Reset all your rankings? This will clear your entire list ' +
      ' and cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
          // TOAST? ('Cancel game drop');
          }
        },
        {
          text: 'Reset',
          handler: data => {
            this.list.rankedSet = [];
            this.nextComparison();
            this.nav.present(Toast.create({message: 'Rankings reset.'}))
          }
        }
      ]
    });
    this.nav.present(prompt)
  }
  rankOf(game){
    let index = _.findIndex(this.list.rankedSet, fg => {
      fg.gameId == game.gameId;
    });
    return index > -1 ? index + 1 : index;
  }
  dragged(indices){
    if(indices.from > -1 && indices.to > -1){
      this.list.rankedSet = reorderArray(this.list.rankedSet, indices);
      this.incumbent = this.getIncumbent();
      this.save();
    }
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
    if(game == this.challenger){
      this.updatingChallenger = true;
    }
    if(game == this.incumbent){
      this.updatingH2H = true;
    }
    this.unrank(game);
    _.remove(this.list.set, game);
    if(game == this.challenger){
      this.challenger = undefined;
      this.resetComparisons();
    }
    _.delay(() => {
      this.updatingChallenger = false;
      this.updatingH2H = false;
    }, 300);
    this.save();
  }
  dropping(game){
    if(this.promptDrops){
      let confirm = Alert.create({
        title: 'Drop ' + game.name + ' from pool?',
        message: 'Remove ' + game.name + ' from the pool of games to be ranked? This can\'t be undone. To get it back you would have to start a new list.',
        inputs: [
          {
            type: 'checkbox',
            label: 'Don\'t ask again.',
            value: 'mute'
          }
        ],
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
              if(data.indexOf('mute') > -1){
                this.promptDrops = false;
              }
              this.drop(game);
            }
          }
        ]
      })
      this.nav.present(confirm);
    }else{
      this.drop(game);
    }
  }

  unrank(game){
    // TOAST? ('unranking');
    let removed = _.remove(this.list.rankedSet, game);
    if(removed.length < 1){
      return false;
    }
    if(game == this.incumbent){
      // handle case where incumbent becomes unranked (get new incumbent)
      this.updatingH2H = true;
      this.incumbent = this.getIncumbent();
    }
    this.sort();
    if(typeof this.challenger == 'undefined' || !this.challenger){
      this.challenger = this.getOne();
    }
    this.save();
    _.delay(() => {this.updatingH2H = false}, 300)
    return true;
  }

  unrankedGames(){
    if(this.list.set.length > this.list.rankedSet.length){
      return _.differenceBy(this.list.set, this.list.rankedSet, 'gameId');
    }
    return [];
  }

  getOne(){
    try{
      return _.shuffle(this.unrankedGames()).pop();
    }catch(e){
      return undefined;
    }
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
      // TOAST? ('dropping ' + size + ' from the right');
      return this.remainder.slice(0,index);
    }
    // TOAST? ('dropping ' + size + ' from the left');
    return this.remainder.slice(index + 1, this.remainder.length);
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
      if (typeof this.challenger == 'undefined' || !this.challenger ||
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

  inRem(game: Game){
    if(!this.remainder){
      return false;
    }
    return this.remainder.indexOf(game) > -1;
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

  notAllGames(){
    return _.differenceBy(this.data.games,
      this.list.set, game => {
        return game['gameId'];
      }).length > 0;
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
            if(typeof this.challenger == 'undefined' || !this.challenger){
              this.challenger = this.getOne();
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
            this.list.name = data.name;
            this.save();
          }
        }
      ]
    })
    this.nav.present(prompt);
  }
  log(item){
    if(this.logging){
      console.log(item);
    }
  }
}
