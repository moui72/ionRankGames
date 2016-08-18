import { Component } from '@angular/core';
import { BggOpts } from '../../bggopts.class';
import { ViewController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Game } from '../../game.class';
import { List } from '../../list.class';

@Component({
  template: `
    <ion-content padding>
      <div class="wrap">
        <h1>Import list from file</h1>
        <p>Import a list from a previously exported file.</p>
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
export class UploadList {
  constructor(private viewCtrl: ViewController, private params: NavParams) {
    this.status = 'Choose a file to import.';
    this.key = params.get('key');
  }
  key: string;
  file: File;
  status: string;
  valid: boolean = false;
  list: List;

  upload() {
    // parameter is returned to caller as onDismiss event
    this.viewCtrl.dismiss(this.list);
  }

  checkFile(ev){
    this.valid = false;
    let updateStatus = msg => {
      this.status = msg;
    }
    let valid = () => {
      this.valid = true;
    }
    let setData = list => {
      this.list = list;
    }
    let reader = new FileReader();
    reader.onload = event => {
      let data = {};
      try{
        data = JSON.parse(event.target['result']);
      }catch(e){
        updateStatus('File is not valid JSON.');
      }
      try{
        let list = new List(this.key)
        if(!_.has(data, 'name') || !_.has(data, 'set')){
          //
          throw new Error('Invalid file.');
        }
        if(data['set'].length > 0){
          try{
            list.name = data['name'];
            list.set = data['set'];
            list.rankedSet = data['rankedSet'];
            list.lastEdit = Date.now();
            valid();
            updateStatus('Import list "' + list.name + '" with a pool of ' +
              list.set.length + ' games (' + list.rankedSet.length +
              ' ranked)?');
            setData(list);
          }catch(e){
            throw new Error('Imported object is not a RankGames list.');
          }
        } else {
          updateStatus('List contains no games.');
        }
      }catch(e){
        updateStatus('File does not contain a RankGames list.');
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
