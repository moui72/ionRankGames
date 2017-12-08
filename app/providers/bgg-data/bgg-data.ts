import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/retry';

/*
  Generated class for the BggData provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class BggData {
  data: Array<any>;
  private rootAddr  = 'http://rankgames.ty-pe.com/bggapi/';
  private command   = '?username=';

  constructor(private http: Http) {
    this.data = [];
  }

  fetch(username) {
    // TOAST? ('fetching games for ' + username);
    // don't have the data yet
    return new Promise((resolve, reject) => {
      // We're using Angular Http provider to request the data,
      // then on the response it'll map the JSON data to a parsed JS object.
      // Next we process the data and resolve the promise with the new data.
      this.http.get(this.rootAddr+this.command+username)
      .map(res => res.json())
      .subscribe(data => {
        console.log(data);
        if (data.error || data.status === 202) {
          if (!data.status) {
            data.status = 500;
          }
          reject(data);
        }
        if(!data || data.length < 1){
          reject(null);
        }
        this.data = data;
        resolve(this.data);
      },
      err => {
        reject(err);
      })
    })
  }
}
