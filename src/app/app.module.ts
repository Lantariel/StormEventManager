import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';
import { CreerTournoiComponent } from './tournoi/creer-tournoi/creer-tournoi.component';
import { ListeTournoisComponent } from './tournoi/liste-tournois/liste-tournois.component';
import { ListeDesJoueursComponent } from './joueurs/liste-des-joueurs/liste-des-joueurs.component';
import {AuthService} from './services/auth.service';
import {JoueurService} from './services/joueur.service';
import {MatchService} from './services/match.service';
import {RondeService} from './services/ronde.service';
import {HttpClientModule} from '@angular/common/http';
import { HeaderComponent } from './header/header.component';
import {AuthGuardService} from './services/auth-guard.service';
import { GererTournoiComponent } from './tournoi/gerer-tournoi/gerer-tournoi.component';
import { JoueursLocauxComponent } from './joueurs/joueurs-locaux/joueurs-locaux.component';
import { CreerJoueurLocalComponent } from './joueurs/creer-joueur-local/creer-joueur-local.component';
import {NgSelectModule} from '@ng-select/ng-select';
import { GererRondesComponent } from './tournoi/gerer-rondes/gerer-rondes.component';
import {VariablesGlobales} from './services/variablesGlobales';
import {TournoiService} from './services/tournoi.service';
import { GererJoueursComponent } from './tournoi/gerer-joueurs/gerer-joueurs.component';

const appRoutes: Routes = [
  {path: 'auth/signup', component: SignupComponent},
  {path: 'auth/signin', component: SigninComponent},
  {path: 'listejoueurs', canActivate: [AuthGuardService], component: JoueursLocauxComponent},
  {path: 'creertournoi', canActivate: [AuthGuardService], component: CreerTournoiComponent},
  {path: 'listetournois', canActivate: [AuthGuardService], component: ListeTournoisComponent},
  {path: 'addplayer', canActivate: [AuthGuardService], component: CreerJoueurLocalComponent},
  {path: 'gerertournoi/:id', canActivate: [AuthGuardService], component: GererTournoiComponent},
  {path: 'gererronde/:id', canActivate: [AuthGuardService], component: GererRondesComponent},
  {path: '', redirectTo: 'listetournois', pathMatch: 'full'},
  {path: '**', redirectTo: 'listetournois'}
] ;

@NgModule({
  declarations: [
    AppComponent,
    SigninComponent,
    SignupComponent,
    CreerTournoiComponent,
    ListeTournoisComponent,
    ListeDesJoueursComponent,
    HeaderComponent,
    GererTournoiComponent,
    JoueursLocauxComponent,
    CreerJoueurLocalComponent,
    GererRondesComponent,
    GererJoueursComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        RouterModule.forRoot(appRoutes),
        NgSelectModule
    ],
  providers: [
    AuthService,
    JoueurService,
    MatchService,
    RondeService,
    TournoiService,
    VariablesGlobales
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
