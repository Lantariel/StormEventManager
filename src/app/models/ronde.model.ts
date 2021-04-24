import {Match} from './match.model';
import {Joueur} from './joueur.model';

export class Ronde {

  /* Informations de la ronde */
  public roundNumber: number ;
  public tournament: string ;

  /* Composants de la ronde */
  public matches: Match[] = []; // matchs à jouer dans la ronde
  public finalStandings: Joueur[] = []; // classement final, mis à jour à la fermeture de la ronde

  /* Statut de la ronde */
  public isActive: boolean ;
  public firstPairingsAlreadySubmitted: boolean ;

  constructor(tnName: string, roundNb: number) {
    this.roundNumber = roundNb ;
    this.tournament = tnName ;
    this.isActive = true ;
    this.finalStandings.push(new Joueur('' , '' , '0')) ;
  }
}
