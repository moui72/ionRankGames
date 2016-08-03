import { Component } from '@angular/core';
import { BggOpts } from '../../bggopts.class';
import { ViewController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Game } from '../../game.class';

@Component({
  template: `
    <ion-content padding>
      <div class="wrap">
        <h1>Import games from file</h1>
        <p>Import games from a previously exported file.</p>
        <p warning>This will overwrite your current library.</p>
        <p>{{status}}</p>
        <ion-list>
          <ion-item>
          <input type="file" name="fileInput"
          (change)="checkFile($event)"/>
          </ion-item>
        </ion-list>
        <div>
          <button (click)="cancel()">
            <ion-icon name="close"></ion-icon> Cancel
          </button>
          <button (click)="upload(upFile)" [disabled]="!valid">
            <ion-icon name="download" class="flip"></ion-icon> Import
          </button>
        </div>
      </div>
    </ion-content>
  `
})
export class UploadGames {
  constructor(private viewCtrl: ViewController, private params: NavParams) {
    this.status = 'Choose a file to import.'

  }

  file: File;
  status: string;
  valid: boolean = false;
  games: Game[];

  upload() {
    // parameter is returned to caller as onDismiss event
    this.viewCtrl.dismiss(this.games);
  }

  checkFile(ev){
    let updateStatus = msg => {
      this.status = msg;
    }
    let valid = () => {
      this.valid = true;
    }
    let setGames = games => {
      this.games = games;
    }
    let reader = new FileReader();
    reader.onload = event => {
      let data = {};
      let games = [];
      try{
        data = JSON.parse(event.target['result']);
      }catch(e){
        updateStatus('File is not valid JSON.');
      }
      try{
        games = _.values(data);
        if(!_.sample(games)['gameId']){
          throw new Error('Invalid file.');
        }
        if(games.length > 0){
          valid();
          updateStatus('Import ' + games.length + ' games?');
          setGames(games);
        } else {
          updateStatus('File contains an empty library.');
        }
      }catch(e){
        updateStatus('File does not contain a RankGames library.');
      }
    };
    reader.onerror = function(event) {
      updateStatus("File could not be read! Code " + event.target['error'].code);
    };
    this.file = ev.srcElement.files[0];
    reader.readAsText(this.file);
  }

  cancel(){
    this.viewCtrl.dismiss();
  }
}
