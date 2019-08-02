import { Component, OnDestroy, ChangeDetectionStrategy,  } from '@angular/core';

import { Subscription, Observable, EMPTY, combineLatest, Subject, BehaviorSubject } from 'rxjs';

import { Product } from './product';
import { ProductService } from './product.service';
import { catchError, tap, map } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { FormControl } from '@angular/forms';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements  OnDestroy {
  pageTitle = 'Product List';
  errorMessage = '';
  selectedCategoryId = 1;
  selectedCatInput = new FormControl('');

  products: Product[] = [];
  sub: Subscription;
  private categrorySelectedSubject = new BehaviorSubject<number>(0);
  categorySelectedAction$ = this.categrorySelectedSubject.asObservable();

  products$ = this.productService.productsWithCategory$
  .pipe(
    catchError(err => {
      this.errorMessage = err;
      return EMPTY;
    })
  );

  productSimpleFilter$ = this.productService.productWithAdd$

  productComplexFilter$ = combineLatest([this.productSimpleFilter$, this.categorySelectedAction$])
    .pipe(
      map(([products, categoriesID]) =>
          products.filter((product: Product) => 
            categoriesID? categoriesID === product.categoryId : true
          )
      ),
      catchError(err => {
        this.errorMessage = err;
        return EMPTY
      })
    );
        
  productCategories$ = this.productCategoryService.productCategories$;
  constructor(private productService: ProductService, private productCategoryService: ProductCategoryService) { }
  
  ngOnInit(): void { }

  ngOnDestroy(): void {
    // this.sub.unsubscribe();
    // not needed anymore
  }

  onAdd(): void {
    this.productService.addProduct();
  }

  onSelected(categoryId: string): void {
    this.categrorySelectedSubject.next(+categoryId);
  }
}
