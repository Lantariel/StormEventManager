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
import { AfficherInfosAuxJoueursComponent } from './tournoi/afficher-infos-aux-joueurs/afficher-infos-aux-joueurs.component';
import { SwitchpairingsComponent } from './tournoi/switchpairings/switchpairings.component';
import { PreviousRoundsComponent } from './tournoi/previous-rounds/previous-rounds.component';
import { FinalmatchesComponent } from './tournoi/finalmatches/finalmatches.component';
import { DisplayTournamentResultsComponent } from './tournoi/display-tournament-results/display-tournament-results.component';
import {PermissionsService} from './services/permissions.service';
import { PrelaunchComponent } from './tournoi/prelaunch/prelaunch.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import { DisplayMetagameComponent } from './tournoi/display-metagame/display-metagame.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const appRoutes: Routes = [
  {path: 'auth/signup', component: SignupComponent},
  {path: 'auth/signin', component: SigninComponent},
  {path: 'listejoueurs', canActivate: [AuthGuardService], component: JoueursLocauxComponent},
  {path: 'creertournoi', canActivate: [AuthGuardService], component: CreerTournoiComponent},
  {path: 'listetournois', canActivate: [AuthGuardService], component: ListeTournoisComponent},
  {path: 'addplayer', canActivate: [AuthGuardService], component: CreerJoueurLocalComponent},
  {path: 'gerertournoi/:id', canActivate: [AuthGuardService], component: GererTournoiComponent},
  {path: 'gererronde/:id', canActivate: [AuthGuardService], component: GererRondesComponent},
  {path: 'gererjoueurs/:id', canActivate: [AuthGuardService], component: GererJoueursComponent},
  {path: 'afficherinfos/:id', canActivate: [AuthGuardService], component: AfficherInfosAuxJoueursComponent},
  {path: 'switchpairings/:id', canActivate: [AuthGuardService], component: SwitchpairingsComponent},
  {path: 'previousrounds/:id', canActivate: [AuthGuardService], component: PreviousRoundsComponent},
  {path: 'finalmatches/:id', canActivate: [AuthGuardService], component: FinalmatchesComponent},
  {path: 'tournamentresults/:id', canActivate: [AuthGuardService], component: DisplayTournamentResultsComponent},
  {path : 'prelaunch/:id', canActivate: [AuthGuardService], component: PrelaunchComponent},
  {path : 'displaymetagame/:id', canActivate: [AuthGuardService], component: DisplayMetagameComponent},
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
    GererJoueursComponent,
    AfficherInfosAuxJoueursComponent,
    SwitchpairingsComponent,
    PreviousRoundsComponent,
    FinalmatchesComponent,
    DisplayTournamentResultsComponent,
    PrelaunchComponent,
    DisplayMetagameComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes),
    NgSelectModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    BrowserAnimationsModule
  ],
  providers: [
    AuthService,
    JoueurService,
    MatchService,
    RondeService,
    TournoiService,
    VariablesGlobales,
    PermissionsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
