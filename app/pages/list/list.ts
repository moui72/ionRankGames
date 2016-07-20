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
    console.log(this.list);
    this.remainder = this.list.rankedSet;
    this.nextComparison();
  }

  save(){
    this.listdb.update(this.list);
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
              console.log('Cancel game drop');
            }
          },
          {
            text: 'Drop',
            handler: data => {
              _.remove(this.list.set, game);
              this.save();
            }
          }
        ]
      })
      this.nav.present(confirm);
  }

  unrankedGames(){
    return _.differenceBy(this.list.set, this.list.rankedSet, 'gameId');
  }

  getOne(){
    return _.shuffle(this.unrankedGames()).pop();
  }

  getIncumbent(remainder: Array<Game>){
    return remainder[_.floor(remainder.length / 2)];
  }

  getRemainder(remainder: Array<Game>, index: number, goUp: boolean){
    console.log('getting new comparison set, going ' + (goUp ? 'up' : 'down') + '.');
    if(goUp){
      let size = remainder.length % 2 == 0 ? index : index + 1;
      return _.dropRight(remainder, size);
    }
    let size = remainder.length % 2 == 0 ? index + 1 : index;
    return _.drop(remainder, size);
  }

  nextComparison(){
    console.log('setting up new comparison...')
    if(this.list.rankedSet.length < 1){
      this.append(this.getOne());
    }
    this.incumbent = this.getIncumbent(this.remainder);
    if (this.challenger == undefined || _.indexOf(this.list.rankedSet, this.challenger) > -1){
      this.challenger = this.getOne();
    }
    this.save();
    console.log('Challenger: ' + this.challenger.name);
    console.log('Incumbent: ' + this.incumbent.name);
  }

  choose(winner){
    console.log('and the winner is... ' + (this.challenger == winner ? 'the challenger!' : 'the incumbent.'));
    let incumbentIndex = _.indexOf(this.list.rankedSet, this.incumbent);
    this.remainder = this.getRemainder(
      this.remainder,
      incumbentIndex,
      this.challenger == winner // challenger is winner? go up; else: go down
    );

    if (this.remainder.length < 1) {
      // no comparisons left to make, so insert the game
      this.rank(this.challenger, incumbentIndex);
    }
    // advance to next comparison
    this.nextComparison();
  }

  rank(game, index){
    console.log('inserting ' + game.name + ' at ' + index);
    this.list.rankedSet.splice(index, 0, game);
    this.remainder = this.list.rankedSet;
    console.log(this.remainder);
    return game;
  }

  incumbentRank(){
    return _.indexOf(this.list.rankedSet, this.incumbent) + 1;
  }

}
