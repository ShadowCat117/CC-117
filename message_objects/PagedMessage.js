class PagedMessage {
    // Creates a paged message
    // message: The message where this PagedMessage is used
    // pages: Pages for the message
    constructor(message, pages) {
        this.message = message;
        this.pages = pages;

        this.currentPage = 0;
    }

    // Gets the next page or first page if on final page
    getNextPage() {
        if (this.currentPage == this.pages.length - 1) {
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
            this.currentPage = this.pages.length - 1;
            return this.pages[this.currentPage];
        } else {
            this.currentPage -= 1;
            return this.pages[this.currentPage];
        }
    }
}

module.exports = PagedMessage;
