import { Component, Input } from '@angular/core';
import {
  NavController,
  NavParams,
  Loading,
  Alert,
  Storage,
  LocalStorage,
  Modal,
  Toast } from 'ionic-angular';
import { Game } from '../../game.class';
import { List, WrappedList } from '../../list.class';
import { ListPage } from '../list/list'
import { Listdb } from '../../providers/listdb/listdb';
import { Data } from '../../providers/data/data';
import * as _ from 'lodash';
import * as fileSaver from 'file-saver'
import { UploadList } from '../../components/modals/upload-list'
/*
  Generated class for the ListsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/lists/lists.html'
})

export class ListsPage {
  lists: Array<List>          = [];
  showingCtrl: Array<number>  = [];
  newName: string             = '';
  local: Storage;
  logging: boolean = false;

  constructor(
      private nav: NavController,
      private params: NavParams,
      private listdb: Listdb,
      private data: Data
    )
  {
    this.lists = [];
    this.getLists();
    this.local = new Storage(LocalStorage);
  }

  getLists(){
    this.listdb.getLists().then(lists => {
      this.lists = this.listdb.lists;
    });
  }

  pool(){
    return _.filter(this.data.games, game => {
      return !(game.filtered || game.trash);
    })
  }

  create(){
    let list = new List(this.nextKey());
    list.name = this.newName || 'new list';
    if(this.data.games){
      list.set = this.pool();
    }
    this.pushList(list);
  }

  pushList(list){
    this.lists.push(list);
    this.listdb.create(list);
    if(!this.local.get('lastList')){
      this.setLast(list);
    }
  }

  edit(list){
    this.nav.parent.parent.push(ListPage, {list: list});
    this.setLast(list);
  }

  setLast(list){
    this.local.set('lastList', JSON.stringify(list));
  }

  destroying(list){
    let confirm = Alert.create({
      title: 'Delete ' + list.name,
      message: 'Delete all list data? This cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            // TOAST?: list destruction canceled
          }
        },
        {
          text: 'Destroy',
          handler: data => {
            this.destroy(list);
          }
        }
      ]
    })
    this.nav.present(confirm);
  }

  renaming(list){
    let prompt = Alert.create({
      title: 'Rename ' + list.name,
      message: 'Change the name of this list',
      inputs: [{
        name: 'toName',
        placeholder: 'New list name'
      }],
      buttons: [
        {
          text: 'Cancel',
          icon: 'close',
          handler: data => {
            // TOAST?: list renaming canceled
          }
        },
        {
          text: 'Rename',
          icon: 'check',
          handler: data => {
            list.name = data.toName;
            this.listdb.update(list);
          }
        }
      ]
    })
    this.nav.present(prompt);
  }

  destroy(list){
    _.remove(this.lists, li => {
      return li.key == list.key;
    })
    let key: string = 'li_' + list.key;
    this.listdb.destroy(list);
  }

  thereAreLists(){
    if(this.lists && this.lists.length > 0){
      return true;
    }
    return false;
  }

  nextKey(){
    if(this.lists.length > 0){
      let last =  _.last(_.sortBy(this.lists, list => {return list.key})).key;
      return (Number(last) + 1).toString();
    }
    return '1';
  }

  rankedCount(list){
    if(list.rankedSet == undefined){
      return 0;
    }
    return list.rankedSet.length;
  }

  unrankedCount(list){
    if(list.set.length == undefined){
      return 0;
    }
    return list.set.length;
  }

  showCtrl(id){
    return id == this.showingCtrl;
  }

  toggleCtrl(id){
    this.showingCtrl = this.showingCtrl == id ? -1 : id;
  }

  exportJSON(lists){
    let json = JSON.stringify(lists);
    let blob = new Blob([json], {type: "text/plain;charset=utf-8"});
    fileSaver.saveAs(blob, 'rg_lists.json');
  }

  importing(){
    let umodal = Modal.create(UploadList, {key: this.nextKey()});
    this.nav.present(umodal);
    umodal.onDismiss((list: List) => {
      this.pushList(list);
    });
  }

  log(msg){
    if(this.logging){
      console.log(msg);
    }
  }
}
