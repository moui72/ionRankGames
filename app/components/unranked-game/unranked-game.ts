import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Game } from '../../game.class';

/*
  Generated class for the UnrankedGame component.

  See https://angular.io/docs/ts/latest/api/core/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: 'unranked-game',
  templateUrl: 'build/components/unranked-game/unranked-game.html'
})
export class UnrankedGame {

  @Input() game: Game;
  @Input() last: number;
  @Output() onAppend  = new EventEmitter<Game>();
  @Output() onPrepend = new EventEmitter<Game>();
  @Output() onDrop    = new EventEmitter<Game>();
  showControls: boolean = false;

  constructor() {
  }

  append(game){
    this.onAppend.emit(game);
  }
  prepend(game){
    this.onPrepend.emit(game);
  }
  drop(game){
    this.onDrop.emit(game);
  }

  toggleControls(){
    this.showControls = !this.showControls;
  }
}
