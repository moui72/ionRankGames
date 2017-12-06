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
        if (data.error) {
          reject(data.error)
        }
        if(!data || data.length < 1){
          resolve([]);
        }
        this.data = data;
        resolve(this.data);
      },
      err => {
        console.log('err');
        console.log(err);
        if (err.error instanceof Error) {
          // A client-side or network error occurred. Handle it accordingly.
          reject('An error occurred:' + err.error.message);
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong.
          if (err.status === 0) {
            reject (
              'The server rejected your request. '
              + 'Please report this to the developer.'
            )
          }
          reject(`Backend returned code ${err.status}, body was: ${err.error} (err: ${err})`);
        }
        reject(err);
      })
    })
  }
}
