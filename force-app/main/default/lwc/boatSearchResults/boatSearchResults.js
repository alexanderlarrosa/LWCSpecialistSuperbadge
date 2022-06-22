import { LightningElement, wire, api, track } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import BoatMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';

export default class BoatSearchResults extends LightningElement {
  @api selectedBoatId;
  columns = [
    { label: 'Name', fieldName: 'Name', type: 'text', editable: 'true'  },
    { label: 'Length', fieldName: 'Length__c', type: 'number', editable: 'true' },
    { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: 'true' },
    { label: 'Description', fieldName: 'Description__c', type: 'text', editable: 'true' }
  ];
  boatTypeId = '';
  @track draftValues = [];
  @track boats;
  isLoading = false;
  
  // wired message context
  @wire(MessageContext) messageContext;
  // wired getBoats method
  @wire(getBoats, { boatTypeId: '$boatTypeId' }) 
  wireBoats(result){
    if(result.error){
      console.log(result.error);
    }else{
      this.boats = result;
    }
  }
  
  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  
  @api searchBoats(boatTypeId) {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    this.boatTypeId = boatTypeId;
  }
  
  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api
    async refresh() {
        this.isLoading = true;
        this.notifyLoading(this.isLoading);
        await refreshApex(this.boats);
        this.isLoading = false;
        this.notifyLoading(this.isLoading);
    }
  
  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) { 
    
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
    
  }
  
  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) { 
    // explicitly pass boatId to the parameter recordId
    //publish(this.messageContext, BoatMC, { recordId : boatId });
    publish(this.messageContext, BoatMC, { recordId : boatId });
  }
  
  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the 
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    // notify loading
    const updatedFields = event.detail.draftValues;
    // Update the records via Apex
    updateBoatList({data: updatedFields})
    .then(result => {
        const toast = new ShowToastEvent({
            title: SUCCESS_TITLE,
            message: MESSAGE_SHIP_IT,
            variant: SUCCESS_VARIANT,
        });
        this.dispatchEvent(toast);
        this.draftValues = [];
        return this.refresh();
    })
    .catch(error => {
        const toast = new ShowToastEvent({
            title: ERROR_TITLE,
            message: error.message,
            variant: ERROR_VARIANT,
        });
        this.dispatchEvent(toast);
    })
    .finally(() => {
        
    });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
      if (isLoading) {
        this.dispatchEvent(new CustomEvent('loading'));
      } else {
          this.dispatchEvent(CustomEvent('doneloading'));
      }
   }
}
