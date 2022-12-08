import {Penalty} from './penalty.model';

export class Joueur {

  nickname: string ; // pseudo du joueur
  score: number ; // Nombre de points sur un tournoi

  // Valeurs pour calculer les départages
  gamesPlayed: number ;
  matchsPlayed: number ;
  gameWins: number ;
  matchWins: number ;
  personnalMatchWinRate: number ;
  opponentsMatchWinRate: number ;
  personnalGameWinRate: number ;
  opponentsGameWinRate: number ;
  currentStanding: number ;
  loss: number ;
  draws: number ;
  eloValue: number ;

  status: string ; // Statut actif ou inactif au sein d'un tournoi
  commander: string; // Général joué au sein d'un tournoi en duel commander
  commanderImgUrl: string ; // url du crop de l'image du général sur Scryfall
  partner: string ; // Général partner
  partnerImgUrl: string ; // Url de l'image du partner
  decklist: string; // Lien vers la decklist
  warnings: Penalty[] = [] ; // Pénalités reçues
  previousOpponents: number[] = [] ; // Index des adversaires affrontés pendant le tournoi
  fixedOnTable: string ; // Table sur laquelle le joueur est assigné
  playingAt: string ; // Table sur laquelle le joueur est en train de jouer
  hasByes: number ; // Nombre de byes que le joueur a pour un tournoi

  playerIndex: number ; // Index dans le tableau des joueurs locaux
  playerIndexInEvent: number ; // Index du joueur au sein d'un tournoi
  hasBeenDeckchecked: boolean ; // Le joueur a t-il déjà été deckchecké lors du tournoi

  constructor(public firstName: string, public lastName: string, public playerID: string) {
    this.fixedOnTable = 'none' ;
  }
}
