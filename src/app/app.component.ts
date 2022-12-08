import { Component } from '@angular/core';
import { firebase } from '@firebase/app' ;
import '@firebase/auth' ;
import '@firebase/analytics' ;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
    lastKnownTournamentId: number ;

    constructor() {

      /* -------------------------- DATABASE DE DEV --------------------------  */
      var firebaseConfig = {
        apiKey: "AIzaSyBKCkHL9XeNWW2Na7-GT1ytHJx8gs82Smk",
        authDomain: "stormeventmanager.firebaseapp.com",
        databaseURL: "https://stormeventmanager.firebaseio.com",
        projectId: "stormeventmanager",
        storageBucket: "stormeventmanager.appspot.com",
        messagingSenderId: "808708669706",
        appId: "1:808708669706:web:e4e779ade6c0bc79d1faf3",
        measurementId: "G-H6E432BTM0"
      };

      /* -------------------------- DATABASE DE PROD --------------------------
       const firebaseConfig = {
        apiKey: "AIzaSyCFG0xiGg4bVRnNaPGVMsyWKnhB6-C8BtU",
        authDomain: "stormeventmanagerprod.firebaseapp.com",
        databaseURL: "https://stormeventmanagerprod-default-rtdb.firebaseio.com",
        projectId: "stormeventmanagerprod",
        storageBucket: "stormeventmanagerprod.appspot.com",
        messagingSenderId: "374822269681",
        appId: "1:374822269681:web:205b96d385703377bb2f50",
        measurementId: "G-LF24S273DD"
      };
    */



      firebase.initializeApp(firebaseConfig);
      firebase.analytics();
      this.lastKnownTournamentId = 0;
    }
}
