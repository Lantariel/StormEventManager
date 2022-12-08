import { Injectable } from '@angular/core';
import {Permission} from '../models/permission.model';
import {Subject} from 'rxjs';
import {firebase} from '@firebase/app';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  permissions: Permission[] = [] ;
  permissionsSubject = new Subject<Permission[]>() ;

  constructor() { }

  emitPermission(){
    this.permissionsSubject.next(this.permissions) ;
  }

  savePermission(){
    firebase.database().ref('/permissions').set(this.permissions) ;
  }

  getPermissions(){
    firebase.database().ref('/permissions').on('value', (data) => {
      this.permissions = data.val() ? data.val() : [] ;
      this.emitPermission() ;
    });
  }

  createPermission(newPermission: Permission){
    console.log(this.permissions) ;
    this.permissions.push(newPermission) ;
    this.savePermission() ;
    this.emitPermission() ;
  }

  deletePermission(permission: Permission) {
    const indexPermASupr = this.permissions.findIndex(
      (permissionEl) => {
        if (permissionEl === permission) {
          return true ;
        }
      }
    );

    this.permissions.splice(indexPermASupr, 1) ;
    this.savePermission() ;
    this.emitPermission() ;
  }

  checkIfPermissionExist(mail: string){
    let exist = false ;
    for (let i = 0 ; i < this.permissions.length ; i++)
    { console.log(this.permissions[i].associatedMail) ;
      if (this.permissions[i].associatedMail === mail)
      { exist = true ; }
    }
    return exist ;
  }
}
