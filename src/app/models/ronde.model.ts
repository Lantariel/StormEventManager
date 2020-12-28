import {Match} from './match.model';
import {Joueur} from './joueur.model';

export class Ronde {

  /* Informations de la ronde */
  public roundNumber: number ;
  public tournament: string ;

  /* Composants de la ronde */
  public playersInRound: Joueur[] ; // Joueurs actifs dans la ronde
  public currentMatches: Match[] = []; // matchs à jouer dans la ronde
  public finalStandings: Joueur[] ; // classement final, mis à jour à la fermeture de la ronde

  /* Statut de la ronde */
  public isActive: boolean ;
  public hasStarted: boolean ;

  constructor(tnName: string, roundNb: number) {
    this.roundNumber = roundNb ;
    this.tournament = tnName ;
    this.isActive = true ;
    this.hasStarted = false ;
    this.currentMatches.push(new Match(new Joueur('' , '' , '0'), new Joueur('', '', '0'), tnName)) ;
  }
}
