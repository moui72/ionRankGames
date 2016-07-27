import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Game } from '../../game.class';

/*
  Generated class for the UnrankedGame component.

  See https://angular.io/docs/ts/latest/api/core/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: 'ranked-game',
  templateUrl: 'build/components/ranked-game/ranked-game.html'
})
export class RankedGame {

  @Input() game: Game;
  @Input() rank: number;
  @Output() onDrop    = new EventEmitter<Game>();
  showControls: boolean = false;

  constructor() {
  }

  drop(game){
    this.onDrop.emit(game);
  }

  toggleControls(){
    this.showControls = !this.showControls;
  }
}
