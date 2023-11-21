class ButtonedMessage {
    // Creates a buttoned message
    // text: Text to display on page
    // componentIds: ID's of the component(s)
    // messageType: Type of message. Eg. active hours or last logins
    // pages: Pages to be displayed
    constructor(text = '', componentIds = [], messageType = '', pages = []) {
        if (typeof text === 'string' && Array.isArray(componentIds) && typeof messageType === 'string' && Array.isArray(pages)) {
            this.text = text;
            this.componentIds = componentIds;
            this.messageType = messageType;
            this.pages = pages;
            this.pageCount = this.pages.length;
        } else if (Array.isArray(text)) {
            this.pages = text;
            this.pageCount = this.pages.length;
        } else if (typeof text === 'string') {
            this.text = text;
        }

        this.currentPage = 0;
    }

    // Sets the message that this buttoned message relates to
    setMessage(message) {
        this.message = message;
    }

    // Sets the pages for this buttoned message
    setPages(pages) {
        this.pages = pages;
        this.pageCount = this.pages.length;
    }

    // Gets the next page or first page if on final page
    getNextPage() {
        if (this.currentPage == this.pageCount - 1) {
            this.currentPage = 0;
            return this.pages[this.currentPage];
        } else {
            this.currentPage += 1;
            return this.pages[this.currentPage];
        }
    }

    // Gets the previous page or final page if on first page
    getPreviousPage() {
        if (this.currentPage == 0) {
            this.currentPage = this.pageCount - 1;
            return this.pages[this.currentPage];
        } else {
            this.currentPage -= 1;
            return this.pages[this.currentPage];
        }
    }
}

module.exports = ButtonedMessage;
