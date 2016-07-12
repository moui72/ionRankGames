import { Component } from '@angular/core';
import { BggOpts } from '../../bggopts.class';
import { ViewController, NavParams } from 'ionic-angular';

@Component({
  template: `
  <ion-content padding>
    <form>
      <h2>Filter your game set using BGG data</h2>
      <ion-list>
        <ion-item *ngFor="let field of schema.bool">
          <ion-label inline title="{{field.description}}">{{field.prettyname}}</ion-label>
          <ion-toggle [(ngModel)]="bggOpts[field.name]"></ion-toggle>
        </ion-item>
        <ion-item *ngFor="let field of schema.number">
          <ion-label stacked title="{{field.description}}">{{field.prettyname}}</ion-label>
          <ion-input [disabled]="field.show !== true && bggOpts[field.show] == false" type="number" [(ngModel)]="bggOpts[field.name]"></ion-input>
        </ion-item>
        <ion-item>
          <button (click)=close()>Filter</button>
          <button (click)=cancel()>Cancel</button>
        </ion-item>
      </ion-list>
    </form>
  </ion-content>`
})
export class FilterGames {
  constructor(private viewCtrl: ViewController, private params: NavParams) {
    this.bggOpts = params.get('bggOpts');
  }
  bggOpts: BggOpts = {
    minrating: 7,
    maxrank: 0,
    minplays: 0,
    minAverageRating: 7,
    excludeExp: true,
    owned: true,
    rated: true,
    played: false
  };

  schema = {
    text: [
      {
        name: 'username',
        prettyname: 'BGG Username',
        description: 'BGG username for collection to import.',
      }
    ],
    number: [
      {
        name: 'minrating',
        prettyname: 'Minimum rating',
        description:
         "Collection owner's lowest allowed rating for imported games.",
        default:7,
        min: 0,
        max: 10,
        show: 'rated'
      },
      {
        name: 'minrank',
        prettyname: 'Maximum BGG rank',
        description:
         "Highest allowed BGG rank for imported games (0 for any rank).",
        default:0,
        min: 0,
        max: 100000,
        show: true
      },
      {
        name: 'minplays',
        prettyname: 'Minimum plays',
        description:
         "Collection owner's lowest number of plays for imported games",
        default:0,
        min: 0,
        max: 1000,
        show: 'played'
      },
      {
        name: 'minAverageRating',
        prettyname: 'Minimum average rating',
        description:
         "Lowest allowed average rating on BGG for imported games (0 for any rating)",
        default:7,
        min: 0,
        max: 10,
        show: true
      }
    ],
    bool: [
      {
        name : 'excludeExp',
        prettyname : 'Exclude expansions',
        description: "Filter out expansions?",
        default: true
      },
      {
        name: 'owned',
          prettyname: "Owned only",
          description: "Limit to collection owner's owned games?",
          default: true
      },
      {
        name: 'rated',
        prettyname: 'Rated only',
        description: "Limit to games rated by collection owner?",
        default: true
      },
      {
        name: 'played',
        prettyname: 'Must have play(s) logged',
        description: "Limit to games with plays logged by collection owner?",
        default: false
      },
    ]
  }




  close() {
    // parameter is returned to caller as onDismiss event
    this.viewCtrl.dismiss(this.bggOpts);
  }

  cancel(){
    this.viewCtrl.dismiss();
  }
}
