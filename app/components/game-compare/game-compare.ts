import { Component, Output, Input, EventEmitter } from '@angular/core';
import { Game } from '../../game.class';
/*
  Generated class for the GameCompare component.

  See https://angular.io/docs/ts/latest/api/core/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: 'game-compare',
  templateUrl: 'build/components/game-compare/game-compare.html'
})
export class GameCompare {
  @Input() game: Game;
  @Input() rank: number;
  @Output() onChoose = new EventEmitter<Game>();
  @Output() onDrop = new EventEmitter<Game>();
  @Output() onUnrank = new EventEmitter<Game>();
  text: string;

  constructor() {
    this.text = 'Hello World';
  }

  choose(game){
    this.onChoose.emit(game);
  }

  drop(game){
    this.onDrop.emit(game);
  }

  unrank(game){
    this.onUnrank.emit(game);
  }
}
