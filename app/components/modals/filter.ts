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

        <ion-item *ngFor="let field of schema.number" [hidden]="field.show !== true && bggOpts[field.show] == false">
          <ion-label stacked title="{{field.description}}">{{field.prettyname}}</ion-label>
          <ion-input text-center
            type="number" [(ngModel)]="bggOpts[field.name]"></ion-input>
        </ion-item>

        <ion-item *ngFor="let field of schema.range">
          <ion-label stacked title="{{field.description}}">{{field.prettyname}}: {{bggOpts[field.name]}}</ion-label>
          <ion-range [min]="field.min" [max]="field.max" pin="true"
            [(ngModel)]="bggOpts[field.name]" secondary>
            <ion-icon range-left small [name]="field.iconLow"></ion-icon>
            <ion-icon range-right [name]="field.iconHigh"></ion-icon>
          </ion-range>
        </ion-item>

        <ion-item>
          <button (click)="close()">Filter</button>
          <button (click)="cancel()">Cancel</button>
        </ion-item>
      </ion-list>
    </form>
  </ion-content>`
})
export class FilterGames {
  constructor(private viewCtrl: ViewController, private params: NavParams) {
    this.bggOpts = params.get('bggOpts');
    console.log(this.bggOpts);
  }
  bggOpts: BggOpts;

  schema = {
    text: [
      {
        name: 'username',
        prettyname: 'BGG Username',
        description: 'The boardgamegeek username that owns the collection you are importing.',
      }
    ],
    range: [
      {
        name: 'minrating',
        prettyname: 'Minimum rating',
        description:
         "Collection owner's lowest allowed rating for imported games.",
        default:7,
        min: 0,
        max: 10,
        show: true,
        iconLow: 'thumbs-down',
        iconHigh: 'thumbs-up'
      }
    ],
    number: [
      {
        name: 'minplays',
        prettyname: 'Minimum plays',
        description:
         "Collection owner's lowest number of plays for imported games",
        default:0,
        min: 0,
        max: 50,
        show: 'played',
        iconLow: 'rewind',
        iconHigh: 'fastforward'
      }
    ],
/*
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
        name: 'minAverageRating',
        prettyname: 'Minimum average rating',
        description:
         "Lowest allowed average rating on BGG for imported games (0 for any rating)",
        default:7,
        min: 0,
        max: 10,
        show: true
      }
 */
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
