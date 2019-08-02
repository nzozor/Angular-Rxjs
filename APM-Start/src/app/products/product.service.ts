import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, throwError, combineLatest, BehaviorSubject, Subject, merge, from, of } from 'rxjs';
import { catchError, tap, map, scan, shareReplay, switchMap, toArray, mergeMap, filter } from 'rxjs/operators';

import { Product } from './product';
import { Supplier } from '../suppliers/supplier';
import { SupplierService } from '../suppliers/supplier.service';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { ProductCategoryData } from '../product-categories/product-category-data';
import { ProductCategory } from '../product-categories/product-category';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = this.supplierService.suppliersUrl;
  constructor(private http: HttpClient,
    private supplierService: SupplierService, private productCategoryService: ProductCategoryService) {

      // productCategoryService.productCategories$.subscribe(console.log);
     }

    products$ = this.http.get<Product[]>(this.productsUrl)
    .pipe(
      tap(data => console.log('Products: ', JSON.stringify(data))),
      catchError(this.handleError)
    );

    
  productsWithCategory$ = combineLatest([this.products$, this.productCategoryService.productCategories$])
    .pipe(
      tap(() => console.log('hello')),
      map(([products, categories]) =>
        products.map((product: Product) => {
          return ({
            ...product,
            price: product.price * 1.5,
            category: categories.find((c: ProductCategory) => product.categoryId === c.id).name,
            searchKey: [product.productName]
          } as Product)   
        })
      ),
      shareReplay(1)
    );

    private productSelectedSubject = new BehaviorSubject<number>(2); 
    selectedProduct$ = this.productSelectedSubject.asObservable();
    private productInsertedSubject = new Subject<Product>();
    productInsertedAction$ = this.productInsertedSubject.asObservable();

    productWithAdd$ = merge(
      this.productsWithCategory$,
      this.productInsertedAction$)
      .pipe(
        scan((accumulator: Product[], value: Product) => [...accumulator,value]),
        shareReplay(1),
        tap(console.log)
      );
    
    selectedProductSupllier$ = combineLatest([
      this.selectedProduct$,
      this.supplierService.supplier$
    ]).pipe(
      map(([selectedProductId, suppliers]) => 
        suppliers.filter(supplier => selectedProductId === supplier.id)) 
      );
    
    selectedProductSuppliersJIT$ = this.selectedProduct$
      .pipe(
        filter(selectedProductId => Boolean(selectedProductId)),
        switchMap(selectedProductId => 
          from([selectedProductId])
          .pipe(
            mergeMap(selectedProductId => this.supplierService.getSupplier(selectedProductId)),   
            toArray(),
            tap(suppliers => console.log(`product supplier, ${JSON.stringify(suppliers)}`))
          ))
      );
    
    // selectedProductSuppliersJIT$

    productFiltered$ = combineLatest([this.productsWithCategory$, this.selectedProduct$ ])
      .pipe(
        tap(console.log),
        map( ([products, selectedProductId] ) => {
          // products.map(console.log);
          return products.find((product: Product) => 
            product.id === selectedProductId
          )
        }),
        shareReplay(1)
        // tap(products => console.log(products))
    );

  addProduct(newProduct?: Product) {
    newProduct = newProduct || this.fakeProduct();
    this.productInsertedSubject.next(newProduct);
  }
    
  private fakeProduct() {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      category: 'Toolbox',
      quantityInStock: 30
    };
  }

  private handleError(err: any) {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }

  selectProduct(id: number) {
    this.productSelectedSubject.next(id);
  }
}
  