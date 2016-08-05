import { Component, ViewChild } from '@angular/core';
import { NavController, Tabs } from 'ionic-angular';
import { HomePage } from '../home/home';
import { ListsPage } from '../lists/lists';
import { HelpPage } from '../help/help';
import { Data } from '../../providers/data/data';

/*
  Generated class for the TabsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/tabs/tabs.html',
})
export class TabsPage {
  version: string = '0.1.020';

  @ViewChild('tabs') tabsRef: Tabs;

  // this tells the tabs component which Pages
  // should be each tab's root Page
  private tab1Root: any;
  private tab2Root: any;
  private tab3Root: any;
  logging: boolean = false;
  initialized: boolean = false;
  tabTitle: string;

  constructor(private data: Data) {
    this.tab1Root = HomePage;
    this.tab2Root = ListsPage;
    this.tab3Root = HelpPage;
    this.tabTitle = '';
  }

  ionViewDidEnter(){
    this.initialized = true;
    this.getTabTitle(this.tabsRef.getSelected());
  }

  getTabTitle(t){
    console.log(t)
    if(this.initialized){
      this.tabTitle = t.tabTitle;
    }
  }

  log(text){
    if (this.logging) {
      console.log(text);
    }
  }
}
