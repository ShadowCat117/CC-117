class PromotionRequirement {
    // Create a PromotionRequirement object
    // current: The current value of the requirement that the player has
    // required: The amount that is required for the requirement
    constructor(promotionType, current, required) {
        this.promotionType = promotionType;
        this.current = current;
        this.required = required;
    }
}

module.exports = PromotionRequirement;
