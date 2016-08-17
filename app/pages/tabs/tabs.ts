import { Component, ViewChild } from '@angular/core';
import { NavController, Tabs, Storage, LocalStorage } from 'ionic-angular';
import { HomePage } from '../home/home';
import { ListsPage } from '../lists/lists';
import { ListPage } from '../list/list';
import { HelpPage } from '../help/help';
import { Data } from '../../providers/data/data';
import { List } from '../../list.class';

/*
  Generated class for the TabsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/tabs/tabs.html',
})
export class TabsPage {
  version: string = 'beta-0.2.04';

  @ViewChild('tabs') tabsRef: Tabs;

  // this tells the tabs component which Pages
  // should be each tab's root Page
  private tab1Root: any;
  private tab2Root: any;
  private tab3Root: any;
  logging: boolean = false;
  initialized: boolean = false;
  tabTitle: string;
  lastList: List;
  local: Storage;

  constructor(private data: Data, private nav: NavController) {
    this.local = new Storage(LocalStorage);
    this.tab1Root = HomePage;
    this.tab2Root = ListsPage;
    this.tab3Root = HelpPage;
    this.tabTitle = '';

    try{
      this.local.get('lastList').then(list => {
        this.lastList = JSON.parse(list);
      })
    }catch(e){
        this.lastList = undefined;
        this.log('Last list not stored');
        this.log(e);
      }
  }

  log(text){
    if (this.logging) {
      console.log(text);
    }
  }

  ionViewDidEnter(){
    this.initialized = true;
    this.getTabTitle(this.tabsRef.getSelected());
  }

  getTabTitle(t){
    this.log(t)
    if(this.initialized){
      this.tabTitle = t.tabTitle;
    }
  }


  /**
   * Opens cached list from local storage, if available.
   * @return {[type]} [description]
   */
  openLastList(){
    this.local.get('lastList').then(list => {
      let editList = JSON.parse(list);
      this.nav.push(ListPage, {list: editList});
    }).catch(e => {
      this.log('Cached list not found.');
      this.log(e);
    })
  }
  goHome(){
    this.nav.popToRoot();
    this.tabsRef.select(0);
  }

}
