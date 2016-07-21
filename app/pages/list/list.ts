import { Component } from '@angular/core';
import { NavController, NavParams, reorderArray, Alert } from 'ionic-angular';
import { Game } from '../../game.class';
import { List } from '../../list.class';
import { GameCompare } from '../../components/game-compare/game-compare';
import { UnrankedGame } from '../../components/unranked-game/unranked-game';
import { Listdb } from '../../providers/listdb/listdb';
import * as _ from 'lodash';

/*
  TODO: implement sorting (drag and drop needs event listener)
        cf. http://ionicframework.com/docs/v2/api/components/item/ItemReorder/
 */

@Component({
  templateUrl: 'build/pages/list/list.html',
  directives: [GameCompare, UnrankedGame]
})
export class ListPage {
  list: List;
  challenger: Game;
  incumbent: Game;
  remainder: Game[];

  constructor(private nav: NavController,
    private params: NavParams, private listdb: Listdb)
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
            text: 'Drop',
            handler: data => {
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
    _.remove(this.list.rankedSet, game);
    if(game == this.incumbent){
      // handle case where incumbent becomes unranked (get new incumbent)
      this.incumbent = this.getIncumbent();
    }
    this.sort();
    this.save();
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
    if(this.list.rankedSet.length < 1){
      this.append(this.getOne());
      this.remainder = this.list.rankedSet;
    }
    this.incumbent = this.getIncumbent();
    if (this.challenger == undefined ||
      _.indexOf(this.list.rankedSet, this.challenger) > -1)
    {
      this.challenger = this.getOne();
    }
    this.save();
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

}
