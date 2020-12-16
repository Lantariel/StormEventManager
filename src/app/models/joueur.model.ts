export class Joueur {

  score: number ; // Nombre de points sur un tournoi

  // Valeurs pour calculer les départages
  gamesPlayed: number ;
  matchsPlayed: number ;
  gameWins: number ;
  matchWins: number ;
  opponentsMatchWinRate: number ;
  personnalGameWinRate: number ;
  opponentsGameWinRate: number ;
  currentStanding: number ;

  status: string ; // Statut actif ou inactif au sein d'un tournoi
  commander: string; // Général joué au sein d'un tournoi en duel commander
  decklist: string; // Lien vers la decklist
  warnings: string[] ; // Pénalités reçues
  previousOpponents: number[] = [] ; // Index des adversaires affrontés pendant le tournoi

  playerIndex: number ; // Index dans le tableau des joueurs locaux
  playerIndexInEvent: number ; // Index du joueur au sein d'un tournoi

  constructor(public firstName: string, public lastName: string, public playerID: string) {
  }
}
