import { Component } from '@angular/core';
import { BggOpts } from '../../bggopts.class';
import { ViewController, NavParams } from 'ionic-angular';
/*
  Modal for importing games from BGG
 */
@Component({
  template: `
  <ion-content padding>
    <h2>Import your collection from BGG</h2>
    <ion-list>
      <ion-item>
        <ion-label stacked title="{{schema.description}}">{{schema.prettyname}}</ion-label>
        <ion-input [(ngModel)]="username"></ion-input>
      </ion-item>

      <ion-item>
        <button (click)=close()>Fetch</button>
        <button (click)=cancel()>Cancel</button>
      </ion-item>
    </ion-list>
  </ion-content>`
})
class importGames {

  username: 'Your BGG username';

  schema = {
    name: 'username',
    prettyname: 'BGG Username',
    description: 'BGG username for collection to import.',
  }


  constructor(private viewCtrl: ViewController, private params: NavParams) {
      this.username = params.get('username');
    }

  close() {
    // parameter is returned to caller as onDismiss event
    this.viewCtrl.dismiss(this.username);
  }

  cancel(){
    this.viewCtrl.dismiss();
  }
}
