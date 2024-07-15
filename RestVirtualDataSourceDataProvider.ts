import { Base, Number_$type, runOn, Type, markType } from "igniteui-core/type";
import { IDataSourceVirtualDataProvider, IDataSourceVirtualDataProvider_$type } from "igniteui-core/IDataSourceVirtualDataProvider";
import { IDataSourceDataProvider } from "igniteui-core/IDataSourceDataProvider";
import { ISupportsDataChangeNotifications } from "igniteui-core/ISupportsDataChangeNotifications";
import { IDataSourceSupportsCount } from "igniteui-core/IDataSourceSupportsCount";
import { IDataSourcePage } from "igniteui-core/IDataSourcePage";
import { IDataSourceSchema } from "igniteui-core/IDataSourceSchema";
import { IDataSourceExecutionContext } from "igniteui-core/IDataSourceExecutionContext";
import { IDataSourceDataProviderUpdateNotifier } from "igniteui-core/IDataSourceDataProviderUpdateNotifier";
import { SortDescriptionCollection } from "igniteui-core/SortDescriptionCollection";
import { FilterExpressionCollection } from "igniteui-core/FilterExpressionCollection";
import { LinkedList, LinkedListNode } from "./util";
import { NotifyCollectionChangedEventArgs } from "igniteui-core/NotifyCollectionChangedEventArgs";
import { DataSourcePageRequestPriority } from "igniteui-core/DataSourcePageRequestPriority";
import { RestVirtualDataSourceDataProviderWorker } from "./RestVirtualDataSourceDataProviderWorker";
import { AsyncVirtualDataSourceProviderWorker } from "igniteui-core/AsyncVirtualDataSourceProviderWorker";
import { RestVirtualDataSourceDataProviderWorkerSettings } from "./RestVirtualDataSourceDataProviderWorkerSettings";
import { AsyncVirtualDataSourceDataProviderWorkerSettings } from "igniteui-core/AsyncVirtualDataSourceDataProviderWorkerSettings";
import { DataSourceDataProviderSchemaChangedEventArgs } from "igniteui-core/DataSourceDataProviderSchemaChangedEventArgs";
import { DataSourceSchemaPropertyType } from "igniteui-core/DataSourceSchemaPropertyType";
import { stringContains } from "igniteui-core/string";
import { SummaryDescriptionCollection } from 'igniteui-core/SummaryDescriptionCollection';
import { DataSourceSummaryScope } from 'igniteui-core/DataSourceSummaryScope';
import { TransactionState } from 'igniteui-core/TransactionState';

export class RestVirtualDataSourceDataProvider extends Base implements IDataSourceVirtualDataProvider {
	static $t: Type = markType(RestVirtualDataSourceDataProvider, 'ODataVirtualDataSourceDataProvider', (<any>Base).$type, [IDataSourceVirtualDataProvider_$type]);
	private _worker: RestVirtualDataSourceDataProviderWorker = null;
	private _requests: LinkedList<number> = new LinkedList<number>();
	private _callback: (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void = null;
	constructor() {
		super();
		this._sortDescriptions = new SortDescriptionCollection();
		this._sortDescriptions.onChanged = () => this.sortDescriptions_CollectionChanged(null, null);
		this._groupDescriptions = new SortDescriptionCollection();
		this._groupDescriptions.onChanged = () => this.groupDescriptions_CollectionChanged(null, null);
		this._filterExpressions = new FilterExpressionCollection();
		this._filterExpressions.onChanged = () => this.filterExpressions_CollectionChanged(null, null);
		this._summaryDescriptions = new SummaryDescriptionCollection();
		this._summaryDescriptions.onChanged = () => this.summaryDescriptions_CollectionChanged(null, null);
	}
	private filterExpressions_CollectionChanged(sender: any, e: NotifyCollectionChangedEventArgs): void {
		this.queueAutoRefresh();
	}
	private sortDescriptions_CollectionChanged(sender: any, e: NotifyCollectionChangedEventArgs): void {
		this.queueAutoRefresh();
	}
	private groupDescriptions_CollectionChanged(sender: any, e: NotifyCollectionChangedEventArgs): void {
		this.queueAutoRefresh();
	}
	private summaryDescriptions_CollectionChanged(sender: any, e: NotifyCollectionChangedEventArgs): void {
		this.queueAutoRefresh();
	}
	addPageRequest(pageIndex: number, priority: DataSourcePageRequestPriority): void {
		if (this.deferAutoRefresh) {
			return;
		}
		if (this._worker != null && this._worker.isShutdown) {
			this._worker = null;
			this._callback = null;
		}
		if (this._worker == null) {
			this.createWorker();
		}
		if (priority == DataSourcePageRequestPriority.High) {
			this._requests.addFirst(pageIndex);
		} else {
			this._requests.addLast(pageIndex);
		}
		if (!this._worker.addPageRequest(pageIndex, priority)) {
			this._worker = null;
			this._callback = null;
			this.addPageRequest(pageIndex, priority);
		}
	}
	private createWorker(): void {
		if (!this.valid()) {
			return;
		}
		this._callback = runOn(this, this.raisePageLoaded);
		let settings = this.getWorkerSettings();
		this._worker = new RestVirtualDataSourceDataProviderWorker(settings);
	}
	private valid(): boolean {
		return this.entitySet != null && this.baseUri != null;
	}
	private getWorkerSettings(): RestVirtualDataSourceDataProviderWorkerSettings {
		return ((() => {
			let $ret = new RestVirtualDataSourceDataProviderWorkerSettings();
			$ret.baseUri = this._baseUri;
			$ret.entitySet = this._entitySet;
			$ret.pageSizeRequested = this._pageSizeRequested;
			$ret.timeoutMilliseconds = this._timeoutMilliseconds;
			$ret.pageLoaded = this._callback;
			$ret.executionContext = this._executionContext;
			$ret.sortDescriptions = this._sortDescriptions;
			$ret.groupDescriptions = this._groupDescriptions;
			$ret.filterExpressions = this._filterExpressions;
			$ret.propertiesRequested = this._propertiesRequested;
			$ret.schemaIncludedProperties = this._schemaIncludedProperties;
			$ret.summaryDescriptions = this._summaryDescriptions;
			$ret.summaryScope = this._summaryScope;
			$ret.enableJsonp = this._enableJsonp;
			$ret.isAggregationSupported = this.isAggregationSupported;

            $ret.performFetch = this.performFetch;
            $ret.provideAggregationParameter = this.provideAggregationParameter;
			$ret.provideAggregatedCount = this.provideAggregatedCount;
            $ret.provideDesiredPropertiesParameter = this.provideDesiredPropertiesParameter;
            $ret.provideFilterParameter = this.provideFilterParameter;
            $ret.provideFullCount = this.provideFullCount;
            $ret.provideItems = this.provideItems;
            $ret.provideOrderByParameter = this.provideOrderByParameter;
            $ret.providePagingParameter = this.providePagingParameter;
            $ret.provideUri = this.provideUri;
            $ret.fixedFullCount = this.fixedFullCount;

			return $ret;
		})());
	}
	removePageRequest(pageIndex: number): void {
		let current = this._requests.first;
		while (current != null) {
			if (current.value == pageIndex) {
				this._requests.remove(current);
			}
			current = current.next;
		}
		if (this._worker == null) {
			return;
		}
		this._worker.removePageRequest(pageIndex);
	}
	removeAllPageRequests(): void {
		this._requests.clear();
		if (this._worker == null) {
			return;
		}
		this._worker.removeAllPageRequests();
	}
	close(): void {
		if (this._worker != null) {
			this._worker.shutdown();
			this._worker = null;
			this._callback = null;
		}
	}
	private _pageLoaded: (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void = null;
	get pageLoaded(): (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void {
		return this._pageLoaded;
	}
	set pageLoaded(value: (page: IDataSourcePage, currentFullCount: number, actualPageSize: number) => void) {
		this._pageLoaded = value;
		this.queueAutoRefresh();
	}
	private raisePageLoaded(page: IDataSourcePage, fullCount: number, actualPageSize: number): void {
		if (this._pageLoaded != null) {
			this._currentFullCount = fullCount;
			if (this._currentSchema == null) {
				let currentSchema: IDataSourceSchema = null;
				if (page != null) {
					currentSchema = page.schema();
				}
				this._currentSchema = currentSchema;
				if (this.schemaChanged != null) {
					this.schemaChanged(this, new DataSourceDataProviderSchemaChangedEventArgs(this._currentSchema, this._currentFullCount));
				}
			}
			if (page.pageIndex() != RestVirtualDataSourceDataProviderWorker.schemaRequestIndex) {
				this._pageLoaded(page, fullCount, actualPageSize);
			}
		}
	}
	private killWorker(): void {
		if (this._worker != null) {
			this._worker.shutdown();
			this._worker = null;
			this._callback = null;
		}
	}
	private _pageSizeRequested: number = 50;
	get pageSizeRequested(): number {
		return this._pageSizeRequested;
	}
	set pageSizeRequested(value: number) {
		this._pageSizeRequested = value;
		this.queueAutoRefresh();
	}
	private _baseUri: string = null;
	get baseUri(): string {
		return this._baseUri;
	}
	set baseUri(value: string) {
		let oldValue = this._baseUri;
		this._baseUri = value;
		if (oldValue != this._baseUri) {
			this.queueAutoRefresh();
			if (this.valid() && this.deferAutoRefresh) {
				this.queueSchemaFetch();
			}
		}
	}
	private _entitySet: string = null;
	get entitySet(): string {
		return this._entitySet;
	}
	set entitySet(value: string) {
		let oldValue = this._entitySet;
		this._entitySet = value;
		if (oldValue != this._entitySet) {
			this.queueAutoRefresh();
			if (this.valid() && this.deferAutoRefresh) {
				this.queueSchemaFetch();
			}
		}
	}
	private _timeoutMilliseconds: number = 10000;
	get timeoutMilliseconds(): number {
		return this._timeoutMilliseconds;
	}
	set timeoutMilliseconds(value: number) {
		this._timeoutMilliseconds = value;
		this.queueAutoRefresh();
	}
	getItemValue(item: any, valueName: string): any {
		let dic = <Map<string, any>>item;
		if (dic.has(valueName)) {
			return dic.get(valueName);
		} else {
			return null;
		}
	}
	schemaChanged: (sender: any, args: DataSourceDataProviderSchemaChangedEventArgs) => void = null;
	private _currentFullCount: number = 0;
	private _currentSchema: IDataSourceSchema = null;
	get actualCount(): number {
		return this._currentFullCount;
	}
	get actualSchema(): IDataSourceSchema {
		return this._currentSchema;
	}
	private _executionContext: IDataSourceExecutionContext = null;
	get executionContext(): IDataSourceExecutionContext {
		return this._executionContext;
	}
	set executionContext(value: IDataSourceExecutionContext) {
		this._executionContext = value;
		this.queueAutoRefresh();
	}
	private _updateNotifier: IDataSourceDataProviderUpdateNotifier = null;
	get updateNotifier(): IDataSourceDataProviderUpdateNotifier {
		return this._updateNotifier;
	}
	set updateNotifier(value: IDataSourceDataProviderUpdateNotifier) {
		this._updateNotifier = value;
	}
	private _deferAutoRefresh: boolean = false;
	get deferAutoRefresh(): boolean {
		return this._deferAutoRefresh;
	}
	set deferAutoRefresh(value: boolean) {
		this._deferAutoRefresh = value;
		if (!this._deferAutoRefresh) {
			this.queueAutoRefresh();
		}
		if (this._deferAutoRefresh && this.valid() && this._currentSchema == null) {
			this.queueSchemaFetch();
		}
	}
	get isSortingSupported(): boolean {
		return true;
	}
	get isGroupingSupported(): boolean {
		return this.isAggregationSupported;
	}
	get isFilteringSupported(): boolean {
		return true;
	}
	private _isAggregationSupported: boolean;
	get isAggregationSupported(): boolean {
		return this._isAggregationSupported;
	}
	set isAggregationSupported(isSupported: boolean) {
		this._isAggregationSupported = isSupported;
	}

	private _sortDescriptions: SortDescriptionCollection = null;
	get sortDescriptions(): SortDescriptionCollection {
		return this._sortDescriptions;
	}
	private _groupDescriptions: SortDescriptionCollection = null;
	get groupDescriptions(): SortDescriptionCollection {
		return this._groupDescriptions;
	}
	private _propertiesRequested: string[] = null;
	get propertiesRequested(): string[] {
		return this._propertiesRequested;
	}
	set propertiesRequested(value: string[]) {
		this._propertiesRequested = value;
		this.queueAutoRefresh();
	}
	private _schemaIncludedProperties: string[] = null;
	get schemaIncludedProperties(): string[] {
		return this._schemaIncludedProperties;
	}
	set schemaIncludedProperties(value: string[]) {
		this._schemaIncludedProperties = value;
		this.queueAutoRefresh();
	}
	private _filterExpressions: FilterExpressionCollection = null;
	get filterExpressions(): FilterExpressionCollection {
		return this._filterExpressions;
	}
	private _summaryDescriptions: SummaryDescriptionCollection = null;
	get summaryDescriptions(): SummaryDescriptionCollection {
		return this._summaryDescriptions;
	}
	private _summaryScope: DataSourceSummaryScope;
	get summaryScope(): DataSourceSummaryScope {
		return this._summaryScope;
	}
	set summaryScope(value: DataSourceSummaryScope) {
		this._summaryScope = value;
	}
	private _enableJsonp: boolean = true;
	get enableJsonp(): boolean {
		return this._enableJsonp;
	}
	set enableJsonp(isEnabled: boolean) {
		this._enableJsonp = isEnabled;
	}

    private _fixedFullCount: number = -1;
    get fixedFullCount(): number {
        return this._fixedFullCount;
    }
    set fixedFullCount(value: number) {
        this._fixedFullCount = value;
    }

    private _provideFullCount: (page: any) => number = null;

    get provideFullCount(): (page: any) => number {
        return this._provideFullCount;
    }
    set provideFullCount(value: (page: any) => number) {
        this._provideFullCount = value;
    }

    private _provideOrderByParameter: (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => void = null;
    get provideOrderByParameter(): (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => void {
        return this._provideOrderByParameter;
    }
    set provideOrderByParameter(value: (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => void) {
        this._provideOrderByParameter = value;
    }

    private _provideFilterParameter: (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => void = null;
    get provideFilterParameter(): (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => void {
        return this._provideFilterParameter;
    }
    set provideFilterParameter(value: (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => void) {
        this._provideFilterParameter = value;
    }

    private _provideAggregationParameter: (args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => void = null;
    get provideAggregationParameter():(args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => void {
        return this._provideAggregationParameter;
    }
    set provideAggregationParameter(value: (args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => void) {
        this._provideAggregationParameter = value;
    }

	private _provideAggregatedCount: (item: any) => number = null;
    get provideAggregatedCount():(item: any) => number {
        return this._provideAggregatedCount;
    }
    set provideAggregatedCount(value: (item: any) => number) {
        this._provideAggregatedCount = value;
    }

    private _provideUri: (baseUri: string, entitySet: string, args: { name: string, value: any }[]) => string = null;
    get provideUri():(baseUri: string, entitySet: string, args: { name: string, value: any }[]) => string {
        return this._provideUri;
    }
    set provideUri(value: (baseUri: string, entitySet: string, args: { name: string, value: any }[]) => string) {
        this._provideUri = value;
    }

    private _performFetch: (request: {
        requestUri: string,
        enableJsonpCallback: boolean,
        method: 'GET',
        headers: any,
        data: null
    }, 
    success: (data: any, response: any) => void,
    failure: (err: any) => void) => void = null;

    get performFetch():(request: {
        requestUri: string,
        enableJsonpCallback: boolean,
        method: 'GET',
        headers: any,
        data: null
    }, 
    success: (data: any, response: any) => void,
    failure: (err: any) => void) => void {
        return this._performFetch;
    }
    set performFetch(value:(request: {
        requestUri: string,
        enableJsonpCallback: boolean,
        method: 'GET',
        headers: any,
        data: null
    }, 
    success: (data: any, response: any) => void,
    failure: (err: any) => void) => void) {
        this._performFetch = value;
    }

    private _providePagingParameter: (args: any[], skip: number, take: number) => void = null;
    get providePagingParameter():(args: any[], skip: number, take: number) => void {
        return this._providePagingParameter;
    }
    set providePagingParameter(value: (args: any[], skip: number, take: number) => void) {
        this._providePagingParameter = value;
    }

    private _provideDesiredPropertiesParameter: (args: any[], selectString: string, desiredProperties: string[]) => void = null;
    get provideDesiredPropertiesParameter():(args: any[], selectString: string, desiredProperties: string[]) => void {
        return this._provideDesiredPropertiesParameter;
    }
    set provideDesiredPropertiesParameter(value: (args: any[], selectString: string, desiredProperties: string[]) => void) {
        this._provideDesiredPropertiesParameter = value;
    }

    private _provideItems: (result: any) => any[];
    get provideItems():(result: any) => any[] {
        return this._provideItems;
    }
    set provideItems(value: (result: any) => any[]) {
        this._provideItems = value;
    }
	
	get notifyUsingSourceIndexes(): boolean {
		return true;
	}
	get isItemIndexLookupSupported(): boolean {
		return false;
	}
	get isKeyIndexLookupSupported(): boolean {
		return false;
	}
	notifySetItem(index: number, oldItem: any, newItem: any): void {
		if (this.updateNotifier != null) {
			this.updateNotifier.notifySetItem(index, oldItem, newItem);
		}
	}
	notifyClearItems(): void {
		if (this.updateNotifier != null) {
			this.updateNotifier.notifyClearItems();
		}
	}
	notifyInsertItem(index: number, newItem: any): void {
		if (this.updateNotifier != null) {
			this.updateNotifier.notifyInsertItem(index, newItem);
		}
	}
	notifyRemoveItem(index: number, oldItem: any): void {
		if (this.updateNotifier != null) {
			this.updateNotifier.notifyRemoveItem(index, oldItem);
		}
	}
	_schemaFetchQueued: boolean = false;
	queueSchemaFetch(): void {
		if (this._schemaFetchQueued) {
			return;
		}
		if (this.executionContext != null) {
			this._schemaFetchQueued = true;
			this.executionContext.enqueueAction(runOn(this, this.doSchemaFetchInternal));
		}
	}
	doSchemaFetchInternal(): void {
		if (!this._schemaFetchQueued) {
			return;
		}
		this._schemaFetchQueued = false;
		this.schemaFetchInternal();
	}
	schemaFetchInternal(): void {
		this.schemaFetchInternalOverride();
	}
	protected schemaFetchInternalOverride(): void {
		if (!this.deferAutoRefresh) {
			return;
		}
		this.removeAllPageRequests();
		this.killWorker();
		this.createWorker();
		this.addSchemaRequest();
	}
	private addSchemaRequest(): void {
		this._worker.addPageRequest(RestVirtualDataSourceDataProviderWorker.schemaRequestIndex, DataSourcePageRequestPriority.High);
	}
	_autoRefreshQueued: boolean = false;
	queueAutoRefresh(): void {
		if (this.deferAutoRefresh) {
			return;
		}
		if (this._autoRefreshQueued) {
			return;
		}
		if (this.executionContext != null) {
			this._autoRefreshQueued = true;
			this.executionContext.enqueueAction(runOn(this, this.doRefreshInternal));
		}
	}
	doRefreshInternal(): void {
		if (this.deferAutoRefresh) {
			this._autoRefreshQueued = false;
			return;
		}
		if (!this._autoRefreshQueued) {
			return;
		}
		this._autoRefreshQueued = false;
		this.refreshInternal();
	}
	refreshInternal(): void {
		this.refreshInternalOverride();
	}
	protected refreshInternalOverride(): void {
		this.removeAllPageRequests();
		this.killWorker();
		this.createWorker();
		this._worker.addPageRequest(0, DataSourcePageRequestPriority.Normal);
	}
	flushAutoRefresh(): void {
		this.doRefreshInternal();
	}
	refresh(): void {
		this.refreshInternal();
	}
	indexOfItem(item: any): number {
		return -1;
	}
	indexOfKey(key: any[]): number {
		return -1;
	}
	resolveSchemaPropertyType(propertyPath: string): DataSourceSchemaPropertyType {
		if (this.actualSchema == null) {
			return DataSourceSchemaPropertyType.ObjectValue;
		}
		if (stringContains(propertyPath, ".")) {
			return DataSourceSchemaPropertyType.ObjectValue;
		}
		for (let i = 0; i < this.actualSchema.propertyNames.length; i++) {
			let name = this.actualSchema.propertyNames[i];
			if (name == propertyPath) {
				return this.actualSchema.propertyTypes[i];
			}
		}
		return DataSourceSchemaPropertyType.ObjectValue;
	}

    public setItemValue(item: any, valueName: string, value: any) {
        // does nothing.
    }

    public removeItem(item: any) {
        // does nothing.
    }

    public addItem(item: any) {
        // does nothing.
    }

    createBatchRequest(changes: TransactionState[]) {
        if (this._worker != null)
        {
            this._worker.createBatchRequest(changes);
        }
    }

    private _batchCompleted: (success: boolean, requiresRefresh: boolean, messages: string[]) => void;
    public get batchCompleted() {
        return this._batchCompleted;
    }
    public set batchCompleted(v: (success: boolean, requiresRefresh: boolean, messages: string[]) => void) {
        this._batchCompleted = v;
    }
}

