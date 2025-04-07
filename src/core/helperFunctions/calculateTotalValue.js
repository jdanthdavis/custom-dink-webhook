function calculateTotalValue(items) {
  return items.reduce((total, item) => {
    return total + item.quantity * item.priceEach;
  }, 0);
}

export default calculateTotalValue;
