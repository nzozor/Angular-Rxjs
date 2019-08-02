import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Subscription, EMPTY, Subject } from 'rxjs';

import { Product } from '../product';
import { ProductService } from '../product.service';
import { catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list-alt.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListAltComponent   {
  pageTitle = 'Products';
  errorMessage = '';
  selectedProductId;
  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  products$ = this.productService.productWithAdd$
    .pipe(
      tap(() => console.log('list alt intercepted the product withAdd update')),
      tap(console.log),
      catchError( err => {
        this.errorMessageSubject.next(err);
        return EMPTY;
      })
    );

  constructor(private productService: ProductService) { 
  }

  onSelected(productId: number): void {
    this.productService.selectProduct(productId);
  }
}
