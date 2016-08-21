import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

/*
  Generated class for the HelpPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/help/help.html',
  directives: []
})
export class HelpPage {

  data: {}[];

  constructor(private nav: NavController) {
    
  }
  //   this.data = [
  //     {
  //       name: 'about',
  //       html:   ['This app is intended to help you build ranked lists of games '
  //       + 'from those in your collection on ' +
  //       '<a href="http://boardgamegeek.com">Board Game Geek</a>. It’s open ' +
  //       'source: check it out on ' +
  //       '<a href="https://github.com/moui72/rankGames/">github</a>.'],
  //       children: [
  //         {
  //           name: 'System requirements and limitations',
  //           html: ['This app currently only supports Chrome 52+ on desktop or' +
  //           ' laptop computers. It may not function and may perform poorly ' +
  //           'on mobile devices and in other browsers.'],
  //           children: []
  //         },
  //         {
  //           name: 'Feedback',
  //           html: [
  //             'I welcome any and all feedback. Please use one of the ' +
  //             'following methods to contact me: ' +
  //             '<a href="https://www.boardgamegeek.com/geekmail/compose?touser=' +
  //             'moui">geekmail moui</a>, reply to <a href="https://www.' +
  //             'boardgamegeek.com/article/23452478">my forum thread</a>, or ' +
  //             'create an issue on the <a href="https://github.com/moui72/' +
  //             'rankGames/issues">rankgames github repo</a>.',
  //
  //             'This app stores your data locally, so you may want to ' +
  //             'periodically back up your work using the import/export ' +
  //             'functionality. <span danger>If you ever “clear all data” in ' +
  //             'your browser, you will lose everything.</span>'
  //           ],
  //           children: []
  //         }
  //       ]
  //     },
  //     {
  //       name: 'Games',
  //       html: [
  //         'The games page is where you set up the pool of games that ' +
  //         'you will build your ranked lists from. It offers two views, ' +
  //         'accessible via the “games” and “trashed games” tabs at the bottom ' +
  //         'of the screen. The “games” are those that will be available when ' +
  //         'you make a list. The “trashed games” are those that you have ' +
  //         'trashed individually, or removed via a filter.',
  //
  //         'You can indivually remove games from or restore games to the ' +
  //         'pool of games that will be available for ranking from these views.'
  //       ],
  //       children: [
  //         {
  //           name: 'Menu_commands',
  //           html: [
  //             'The games page also has a menu of commands available. The menu can be opened using the menu icon at the top left.'
  //           ],
  //           children: [
  //             {
  //               name: 'Purge',
  //               html: [
  //                 'The purge command will delete all games that you ' +
  //                 'have imported, whether they have been filtered, trashed ' +
  //                 'or remain in the general pool. This command is ' +
  //                 'irreversible. You will be prompted to confirm before it ' +
  //                 'actually executes.'
  //               ]
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   ]
  // }

}
