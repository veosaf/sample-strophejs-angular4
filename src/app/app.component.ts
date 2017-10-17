import { Component, AfterViewInit } from '@angular/core';

import * as $ from 'jquery';
import * as _ from 'underscore';

// Strophe
declare var Strophe: any;
declare var $iq: any;
declare var $pres: any;
declare var $msg: any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  BOSH_SERVICE = 'http://localhost:7070/http-bind/';
  connection = null;
  isConnected: boolean = false;
  connectedUser = null;
  mydomain = 'localhost';
  jid = null;
  user: any = {};
  contacts: any[] = [];
  searchContacts: any[] = [];

  ngAfterViewInit() {
    this.connection = new Strophe.Connection(this.BOSH_SERVICE);
  }

  connect() {
    this.isConnected = true;
    this.connection.connect(this.user.jid, this.user.password, (status) => this.onConnect(status));
  };

  onConnect(status) {
    if (status == Strophe.Status.CONNECTING) {
      console.log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
      console.log('Strophe failed to connect.');
    } else if (status == Strophe.Status.DISCONNECTING) {
      console.log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
      console.log('Strophe is disconnected.');
      $('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.CONNECTED) {
      console.log('Strophe is connected.');

      //set presense --> status  become available
      this.connection.send($pres());

      this.getRoster();
    }
  }

  subscribe(toJid) {
    this.connection.send($pres({ to: toJid, type: "subscribe" }));
  };

  unsubscribe(toJid) {
    this.connection.send($pres({ to: toJid, type: "unsubscribe" }));
  };

  disconnect() {
    this.isConnected = false;
    this.connection.disconnect();
  };

  isSubscribed(jid) {
    if (!this.contacts) {
      return false;
    }
    for (let contact of this.contacts) {
      if (contact.jid === jid) {
        return true;
      }
    }
    return false;
  }

  search(username) {

    console.log('rrr', username);
    let iq = $iq({
      type: 'set',
      id: 'search4',
      to: 'search.localhost',
      xmlns: 'jabber:client'
    });
    iq.c('query', { xmlns: 'jabber:iq:search' })
      .c('x', { xmlns: 'jabber:x:data', type: 'submit' })
      .c('field', { var: 'search' })
      .c('value', username).up().up()
      .c('field', { var: 'Username', type: "boolean" })
      .c('value', '1').up().up();

    this.connection.sendIQ(iq, stanza => {
      this.searchContacts = _.map(stanza.getElementsByTagName("item"), (item) => {
        return {
          jid: $('[var="jid"]', item).text(),
          username: $('[var="Username"]', item).text(),
          email: $('[var="Email"]', item).text(),
          name: $('[var="Name"]', item).text(),
          isSubscribed: this.isSubscribed($('[var="jid"]', item).text())
        }
      });
    });
  }

  getRoster() {
    this.contacts = []
    let iq = $iq({
      type: 'get',
      id: 'rs1'
    });
    iq.c('query', { xmlns: 'jabber:iq:roster' });
    this.connection.sendIQ(iq, result => {
      console.log('jj', result);
      $.each($('item', result), (idx, item) => {
        this.contacts.push({
          jid: item.getAttribute('jid'),
          subscription: item.getAttribute('subscription')
        });
      });
    });
  }

}
