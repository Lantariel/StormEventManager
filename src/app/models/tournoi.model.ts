import {Joueur} from './joueur.model';
import {Match} from './match.model';
import {Ronde} from './ronde.model';

export class Tournoi {

  /* Informations du tournoi */
  public tournamentIndex: number ; // Index du tournoi pour le cibler
  public nombreDeRondes: number ;

  /* Etats du tournoi */
  public rondeEnCours: number ;
  public isLive: boolean ;
  public inscriptionsOuvertes: boolean ;
  public roundNumberIsFixed: boolean ;
  public isFinished: boolean ;

  /* composants du tournoi */
  public rondes: Ronde[] ;
  public currentStanding: Joueur[] ; // Dernier classement connu du tournoi
  public registeredPlayers: Joueur[] ; // Tableau fixe des joueurs inscrits

  constructor(public tournamentName: string, public format: string, public tournamentId: number) {
    this.registeredPlayers = [] ;
    this.nombreDeRondes = 0 ;
    this.isFinished = false ;
  }
}
