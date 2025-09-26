router.post('/checkout', async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.session.user._id }).populate('items.product');
    if (!cart) {
      req.flash('error_msg', 'Your cart is empty');
      return res.redirect('/cart');
    }

    const order = new Order({
      user: req.session.user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      total: cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      paymentMethod
    });

    await order.save();
    await Cart.deleteOne({ _id: cart._id });

    req.flash('success_msg', `Order placed successfully with ${paymentMethod}`);
    res.redirect('/user/orders');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Something went wrong');
    res.redirect('/checkout');
  }
});
