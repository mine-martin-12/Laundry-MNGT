import React, { useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/currency';

interface Service {
  id: string;
  customer_name: string;
  service_type: string;
  amount: number;
  service_date: string;
  payment_status: 'not_paid' | 'partially_paid' | 'fully_paid';
  payment_method?: string;
  deposit_amount?: number;
  description?: string;
  created_at: string;
}

interface ServicesByDateProps {
  services: Service[];
  onMarkPaid: (serviceId: string) => void;
  onDelete: (serviceId: string) => void;
  userRole?: string;
}

interface GroupedServices {
  [date: string]: Service[];
}

export function ServicesByDate({ services, onMarkPaid, onDelete, userRole }: ServicesByDateProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Group services by date
  const groupedServices: GroupedServices = services.reduce((groups, service) => {
    const date = format(parseISO(service.service_date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(service);
    return groups;
  }, {} as GroupedServices);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedServices).sort((a, b) => b.localeCompare(a));

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const getDateSummary = (services: Service[]) => {
    const totalServices = services.length;
    
    // Amount collected (deposits + full payments)
    const totalAmountCollected = services.reduce((sum, service) => {
      if (service.payment_status === 'fully_paid') {
        return sum + service.amount;
      } else if (service.payment_status === 'partially_paid') {
        return sum + (service.deposit_amount || 0);
      }
      return sum;
    }, 0);
    
    // Total amount for the day (includes unpaid amounts)
    const totalAmountForDay = services.reduce((sum, service) => sum + service.amount, 0);
    
    // Unpaid amounts
    const unpaidAmounts = services.reduce((sum, service) => {
      if (service.payment_status === 'not_paid') {
        return sum + service.amount;
      } else if (service.payment_status === 'partially_paid') {
        return sum + (service.amount - (service.deposit_amount || 0));
      }
      return sum;
    }, 0);
    
    const paidCount = services.filter(s => s.payment_status === 'fully_paid').length;
    const partialCount = services.filter(s => s.payment_status === 'partially_paid').length;
    const unpaidCount = services.filter(s => s.payment_status === 'not_paid').length;

    return { 
      totalServices, 
      totalAmountCollected, 
      totalAmountForDay, 
      unpaidAmounts, 
      paidCount, 
      partialCount, 
      unpaidCount 
    };
  };

  const getPaymentStatusBadge = (service: Service) => {
    switch (service.payment_status) {
      case 'fully_paid':
        return <Badge variant="default" className="bg-success text-success-foreground">Paid</Badge>;
      case 'partially_paid':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Partial</Badge>;
      case 'not_paid':
        return <Badge variant="outline" className="border-destructive text-destructive">Unpaid</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRemainingBalance = (service: Service) => {
    if (service.payment_status === 'partially_paid') {
      return service.amount - (service.deposit_amount || 0);
    }
    if (service.payment_status === 'not_paid') {
      return service.amount;
    }
    return 0;
  };

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const dateServices = groupedServices[date];
        const summary = getDateSummary(dateServices);
        const isExpanded = expandedDates.has(date);
        
        return (
          <Card key={date} className="shadow-medium">
            <Collapsible>
              <CollapsibleTrigger
                className="w-full"
                onClick={() => toggleDate(date)}
              >
                <div className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">
                          {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {summary.totalServices} services • Total: {formatCurrency(summary.totalAmountForDay)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Collected: {formatCurrency(summary.totalAmountCollected)} • Outstanding: {formatCurrency(summary.unpaidAmounts)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        {summary.paidCount > 0 && (
                          <span className="text-success mr-2">
                            {summary.paidCount} paid
                          </span>
                        )}
                        {summary.partialCount > 0 && (
                          <span className="text-warning mr-2">
                            {summary.partialCount} partial
                          </span>
                        )}
                        {summary.unpaidCount > 0 && (
                          <span className="text-destructive">
                            {summary.unpaidCount} unpaid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border-t border-border">
                  <div className="p-4 space-y-3">
                    {dateServices.map((service) => {
                      const remainingBalance = getRemainingBalance(service);
                      
                      return (
                        <Card key={service.id} className="bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                  <h4 className="font-medium truncate">{service.customer_name}</h4>
                                  {getPaymentStatusBadge(service)}
                                  {service.payment_method && (
                                    <Badge variant="outline" className="w-fit">
                                      {service.payment_method}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  {service.service_type}
                                </p>
                                {service.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {service.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                  <span>Total: {formatCurrency(service.amount)}</span>
                                  {service.payment_status === 'partially_paid' && service.deposit_amount && (
                                    <>
                                      <span className="text-warning">
                                        Paid: {formatCurrency(service.deposit_amount)}
                                      </span>
                                      <span className="text-destructive">
                                        Remaining: {formatCurrency(remainingBalance)}
                                      </span>
                                    </>
                                  )}
                                  {service.payment_status === 'not_paid' && (
                                    <span className="text-destructive">
                                      Outstanding: {formatCurrency(service.amount)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {service.payment_status !== 'fully_paid' && (
                                  <Button
                                    size="sm"
                                    onClick={() => onMarkPaid(service.id)}
                                    className="bg-success hover:bg-success/90 flex-1 sm:flex-none"
                                  >
                                    <DollarSign className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Mark Paid</span>
                                    <span className="sm:hidden">Paid</span>
                                  </Button>
                                )}
                                <Link to={`/services/edit/${service.id}`}>
                                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {userRole === 'admin' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDelete(service.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}