class ButtonedMessage {
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

    setMessage(message) {
        this.message = message;
    }

    getNextPage() {
        if (this.currentPage == this.pageCount - 1) {
            this.currentPage = 0;
            return this.pages[this.currentPage];
        } else {
            this.currentPage += 1;
            return this.pages[this.currentPage];
        }
    }

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
