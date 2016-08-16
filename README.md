# rankGames

An app to make top game lists. Built using Typescript, Angular 2 and Ionic 2.

## About
This app is intended to help you build ranked lists of games from those in your collection
on [Board Game Geek](http://boardgamegeek.com). It's open source: check it out on [github](https://github.com/moui72/rankGames/).
## System requirements and limitations
This app currently only supports Chrome 52+ on desktop or laptop computers.
It may not function and may perform poorly on mobile devices and in other browsers.

### Feedback
I welcome any and all feedback. Please use one of the following methods to contact me: [geekmail moui](https://www.boardgamegeek.com/geekmail/compose?touser=moui), reply to [my forum thread](https://www.boardgamegeek.com/article/23452478), or create an issue on the [rankgames github repo](https://github.com/moui72/rankGames/issues).

This app stores your data locally, so you may want to periodically back up your work using the import/export functionality. If you ever "clear all data" in your browser, you will lose everything.


## Games (library)
The games page is where you set up the pool of games that you will build
your ranked lists from. It offers two views, accessible via the "games"
and "trashed games" tabs at the bottom of the screen. The "games" are
those that will be available when you make a list. The "trashed games"
are those that you have trashed individually, or removed via a filter.

You can indivually remove games from or restore games to the pool of
games that will be available for ranking from these views.

### Games menu commands
The games page also has a menu of commands available. The menu can be
opened using the menu icon at the top left.

#### Purge
The purge command will delete all games that you have imported, whether
they have been filtered, trashed or remain in the general pool. This
command is irreversible. You will be prompted to confirm before it
actually executes.

#### Fetch
The fetch command will import all games in a given boardgamegeek user's
collection. Once they've been imported you will be able to manipulate
which ones are actually available during the ranking process.

#### Filter
The filter command will categorically remove games from the available
pool. You can then individually correct any exceptions using the "trash"
or "restore" button for a given game.

#### Download
Download your game libary to a `.json` file. You should use this to back up your data when
appropriate because if you ever "clear all data" in your browser, the app will forget what
you've done.

#### Upload
Restore data from a previously downloaded `.json` file.

## Lists
The lists page is where you can create and manage your ranked lists of games. 
When you create a list, the games that have not been trashed or filtered out 
will be added to the pool of games that you will rank. You can refine this to some 
extent after you have made the list, but it's best to do the bulk of your filtering 
in the game library prior to creating your list.

You can create, edit/open, rename and delete lists. For details on editing a list, see below.

## Editing a list
Once you have opened a list, you can start to rank your games by making comparisons. 
You can also browse both the ranked and unranked sets of games and make corrections via 
drag-and-drop. Below you will find some explanation for some of the commands you'll find 
while editing a list.

### Global commands
The commands on the main menu are not tied to a specific game.

#### Reset
The reset button will unrank all games (*[unrank](#Unrank_game_92)* is defined below).

#### Save to file
The save to file button will download your list as a `.json` file. You should use this to 
back-up your list/

#### Load from file
*Not yet implemented.* The load from file button allows you to import a list from a previously
downloaded `.json` file.

#### Copy &amp; Paste
The copy &amp; paste button will display your list in a copy &amp; paste friendly format. You 
can choose from HTML, plain text, or BGG forum code. You can also choose to display them in
ascending or descending order.

### More
Clicking on an unranked game or clicking the "more" button will make the following commands
visible.

#### Unrank game
Ranked games will have an &times; button to their right. This button will unrank that game.
Unranking a game will remove it from the ranked list and return it to the 
unranked (soon-to-be-ranked) set.

#### Trash game
Dropping a game will remove it from the set of games accessible from this list.
It will not trash it in your library, so it will appear in future lists if you
don't trash it manually or filter it out subsequently.

#### Set to #1
This will straightforwardly prepend a game to your ranked list. You will never be prompted 
to compare a game prepended in this way to other ranked games, only unranked ones, so be careful.

### Set to #X
The value of X will vary; this button will append a game to the end of your ranked list. 
You will never be prompted to compare a game appended in this way to other ranked games, 
only unranked ones, so be careful.
 
