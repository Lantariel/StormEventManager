import {Joueur} from './joueur.model';
import {Match} from './match.model';
import {Ronde} from './ronde.model';

export class Tournoi {

  /* Informations du tournoi */
  public tournamentIndex: number ; // Index du tournoi pour le cibler
  public nombreDeRondes: number ;
  public tournamentType: string ;
  public tournamentPlace: string ;
  public editors: string[] = [];

  /* Etats du tournoi */
  public rondeEnCours: number ;
  public isLive: boolean ;
  public inscriptionsOuvertes: boolean ;
  public roundNumberIsFixed: boolean ;
  public isFinished: boolean ;
  public step: string ;

  /* composants du tournoi */
  public rondes: Ronde[] ;
  public currentStanding: Joueur[] ; // Dernier classement connu du tournoi
  public registeredPlayers: Joueur[] = []; // Tableau fixe des joueurs inscrits
  public currentMatches: Match[] = [] ;
  public tournamentCut: number ;
  public finalBracket: boolean ;
  public tournamentDate: number[] ;

  constructor(public tournamentName: string, public format: string, public tournamentId: number) {
    this.registeredPlayers = [] ;
    this.nombreDeRondes = 0 ;
    this.isFinished = false ;
    this.rondes = [new Ronde(tournamentName, 1)] ;
    this.currentMatches = [new Match(new Joueur('bye', '', '15000'), new Joueur('bye', '', '15000'))] ;
    this.step = 'rounds' ;
    this.tournamentCut = 8 ;
    this.finalBracket = true ;
  }
}
