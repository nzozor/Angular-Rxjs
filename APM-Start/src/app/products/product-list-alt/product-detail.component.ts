import { Component } from '@angular/core';

import { ProductService } from '../product.service';
import { catchError, tap, map, filter } from 'rxjs/operators';
import { BehaviorSubject, Subject, EMPTY, combineLatest } from 'rxjs';
import { Product } from '../product';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent {
  // pageTitle = 'Product Detail';
  errorMessage = '';
  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();
  constructor(private productService: ProductService) { }

  product$ = this.productService.productFiltered$;

  pageTitle$ = this.product$
    .pipe(
      map((p: Product) => p ? `Product Detail for: ${p.productName}` : null)
    );

  productSuppliers$ = this.productService.selectedProductSupllier$
    .pipe(
      catchError(
        err => { this.errorMessageSubject.next(err); return EMPTY; }
      )
    );
  productSupplierJIT$ = this.productService.selectedProductSuppliersJIT$
    .pipe(
      tap(console.log),
      catchError(
        err => { this.errorMessageSubject.next(err); return EMPTY;}
      )
    );

  vm$ = combineLatest([
    this.product$,
    this.productSupplierJIT$,
    this.pageTitle$
  ])
    .pipe(
      filter(([product]) => Boolean(product)),
      map(([product, productSuppliers, pageTitle]) => ({ product, productSuppliers, pageTitle}))
    );
}
