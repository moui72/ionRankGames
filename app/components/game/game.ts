import { Component, Output, Input, EventEmitter } from '@angular/core';
import { Game } from '../../game.class';
/*
  Generated class for the Game component.

  See https://angular.io/docs/ts/latest/api/core/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: 'game-card',
  templateUrl: 'build/components/game/game.html'
})
export class GameCard {
  @Input() game: Game;
  @Output() onRestore = new EventEmitter<Game>();
  @Output() onTrash = new EventEmitter<Game>();
  @Output() onDetail = new EventEmitter<Game>();
  @Output() onCheck = new EventEmitter<Game>();

  constructor() {
  }
  restore(){
    this.onRestore.emit(this.game);
  }
  trash(){
    this.onTrash.emit(this.game);
  }
  detail(){
    this.onDetail.emit(this.game);
  }
  amIout(){
    this.onCheck.emit(this.game);
  }
  isOut(){
    return this.isTrue(this.game.filtered) || this.isTrue(this.game.trash);
  }
  isTrue(exp){
    // check for string/bool true/'true'
    return exp == true || exp == 'true';
  }
}
