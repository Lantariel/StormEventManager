export class DeckInEvent{
  deckName: string ;
  numberOfPlayers: number ;
  deckImgUrl: string ;

  constructor(public name: string, public img: string) {
    this.deckName = name ;
    this.deckImgUrl = img ;
    this.numberOfPlayers = 1 ;
  }
}
