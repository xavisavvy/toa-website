import { useState, FormEvent, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Package, Search, AlertCircle, CheckCircle, Clock, XCircle, ShieldCheck } from 'lucide-react';
import type { Order, OrderItem } from '../../../shared/schema';
import { Helmet } from 'react-helmet-async';

interface OrderDetails {
  order: Order;
  items: OrderItem[];
}

export default function TrackOrder() {
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Security: Clear order details after 10 minutes of inactivity
  useEffect(() => {
    if (orderDetails) {
      const timeout = setTimeout(() => {
        setOrderDetails(null);
        setError('Session expired for security. Please search again.');
      }, 10 * 60 * 1000); // 10 minutes

      return () => clearTimeout(timeout);
    }
  }, [orderDetails]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setOrderDetails(null);

    try {
      const response = await fetch(
        `/api/orders/track?email=${encodeURIComponent(email)}&orderId=${encodeURIComponent(orderId)}`
      );

      if (!response.ok) {
        throw new Error('Order not found or email does not match');
      }

      const data = await response.json();
      setOrderDetails(data);
    } catch (err: any) {
      setError(err.message || 'Unable to find order. Please check your email and order ID.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Security: Prevent indexing of order tracking page */}
      <Helmet>
        <title>Track Your Order - Tales of Aneria</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta name="bingbot" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Privacy Notice */}
          <Card className="mb-8 border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-500 mb-1">Privacy Protected</h3>
                  <p className="text-sm text-muted-foreground">
                    This page is not indexed by search engines. Your order information is private and secure.
                    For your security, order details will be cleared after 10 minutes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!orderDetails ? (
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Package className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Track Your Order</CardTitle>
                <CardDescription>
                  Enter your email and order ID to view your order status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                    <p className="text-xs text-muted-foreground">
                      The email you used when placing your order
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderId">Order ID</Label>
                    <Input
                      id="orderId"
                      type="text"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Found in your order confirmation email
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Track Order
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Order Details</CardTitle>
                      <CardDescription>Order #{orderDetails.order.id.slice(0, 8)}...</CardDescription>
                    </div>
                    {getStatusBadge(orderDetails.order.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                      <p className="text-sm">{formatDate(orderDetails.order.createdAt.toString())}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-sm font-bold">${parseFloat(orderDetails.order.totalAmount).toFixed(2)} {orderDetails.order.currency.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Customer Email</p>
                      <p className="text-sm">{orderDetails.order.customerEmail}</p>
                    </div>
                    {orderDetails.order.printfulOrderId && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Printful Order</p>
                        <p className="text-sm font-mono">{orderDetails.order.printfulOrderId}</p>
                      </div>
                    )}
                  </div>

                  {orderDetails.order.shippingAddress && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Shipping Address</p>
                      <div className="text-sm bg-muted p-3 rounded-md">
                        <p>{orderDetails.order.shippingAddress.name}</p>
                        <p>{orderDetails.order.shippingAddress.line1}</p>
                        {orderDetails.order.shippingAddress.line2 && <p>{orderDetails.order.shippingAddress.line2}</p>}
                        <p>
                          {orderDetails.order.shippingAddress.city}, {orderDetails.order.shippingAddress.state}{' '}
                          {orderDetails.order.shippingAddress.postal_code}
                        </p>
                        <p>{orderDetails.order.shippingAddress.country}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderDetails.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 pb-4 border-b last:border-0">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-medium">${parseFloat(item.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOrderDetails(null);
                  setEmail('');
                  setOrderId('');
                }}
              >
                Track Another Order
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
