import { Component, enableProdMode } from '@angular/core';
import { Platform, ionicBootstrap, Menu, MenuController } from 'ionic-angular';
import { StatusBar } from 'ionic-native';
import { TabsPage } from './pages/tabs/tabs';
import { Data } from './providers/data/data';
import { BggData } from './providers/bgg-data/bgg-data';
import { Db } from './providers/db/db';
import { Listdb } from './providers/listdb/listdb';
enableProdMode();

@Component({
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  providers: [Listdb, Db, Data, BggData]
})
export class MyApp {

  private rootPage:any;

  constructor(private platform:Platform, private menu:MenuController) {
    this.rootPage = TabsPage;

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
    });
  }
}

ionicBootstrap(MyApp, [
])
