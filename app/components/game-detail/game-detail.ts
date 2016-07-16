import { Component, Output, Input, EventEmitter } from '@angular/core';
import { Game } from '../../game.class';

/*
  Generated class for the GameDetail component.

  See https://angular.io/docs/ts/latest/api/core/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: 'game-detail',
  templateUrl: 'build/components/game-detail/game-detail.html'
})
export class GameDetail {
  @Output() onClose = new EventEmitter<Game>();
  @Input() game: Game;

  constructor() {
  }

  close(){
    this.onClose.emit(null);
  }
}
