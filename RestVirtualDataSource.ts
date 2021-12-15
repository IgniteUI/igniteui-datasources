import { FilterExpressionCollection, SortDescriptionCollection, SummaryDescriptionCollection, VirtualDataSource } from "igniteui-react-core";
import { RestVirtualDataSourceDataProvider } from "./RestVirtualDataSourceDataProvider";
import { IDataSource } from "igniteui-react-core";
import { BaseDataSource } from "igniteui-react-core";
import { Base, typeCast, Type, markType } from "igniteui-react-core";
import { IExternalDataSource } from 'igniteui-react-core';

export class RestVirtualDataSource extends VirtualDataSource implements IExternalDataSource {
	constructor() {
		super();
		this.dataProvider = ((() => {
			let $ret = new RestVirtualDataSourceDataProvider();
			$ret.executionContext = this.executionContext;
			$ret.enableJsonp = this.enableJsonp;
			$ret.isAggregationSupported = this.isGroupingSupported;
			return $ret;
		})());
		this.externalDataSource = this;
	}
	private onBaseUriChanged(oldValue: string, newValue: string): void {
        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).baseUri = this.baseUri;
            this.queueAutoRefresh();
        }
	}
	private _baseUri: string = null;
	get baseUri(): string {
		return this._baseUri;
	}
	set baseUri(value: string) {
		let oldValue = this._baseUri;
		this._baseUri = value;
		if (oldValue != this._baseUri) {
			this.onBaseUriChanged(oldValue, this._baseUri);
		}
	}
	private onEntitySetChanged(oldValue: string, newValue: string): void {
        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).entitySet = this.entitySet;
            this.queueAutoRefresh();
        }

		this.queueAutoRefresh();
	}


    private _isFilteringSupportedByServer = false;
    public set isFilteringSupportedByServer(v: boolean) {
        this._isFilteringSupportedByServer = v;
    }
    public get isFilteringSupportedByServer(): boolean {
        return this._isFilteringSupportedByServer;
    }

    protected get_isFilteringSupported(): boolean {
        if (this._isFilteringSupportedByServer) {
            return true;
        }
        return false;
    }

	private _entitySet: string = null;
	get entitySet(): string {
		return this._entitySet;
	}
	set entitySet(value: string) {
		let oldValue = this._entitySet;
		this._entitySet = value;
		if (this._entitySet != oldValue) {
			this.onEntitySetChanged(oldValue, this._entitySet);
		}
	}
	private onTimeoutMillisecondsChanged(oldValue: number, newValue: number): void {
        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).timeoutMilliseconds = this.timeoutMilliseconds;
        }
	}
	private _timeoutMilliseconds: number = 10000;
	get timeoutMilliseconds(): number {
		return this._timeoutMilliseconds;
	}
	set timeoutMilliseconds(value: number) {
		let oldValue = this._timeoutMilliseconds;
		this._timeoutMilliseconds = value;
		if (oldValue != this._timeoutMilliseconds) {
			this.onTimeoutMillisecondsChanged(oldValue, this._timeoutMilliseconds);
		}
	}

	get isSortingSupportedOverride(): boolean {
		return true;
	}
	get isFilteringSupportedOverride(): boolean {
		return true;
	}
	get isGroupingSupportedOverride(): boolean {
		return this.isAggregationSupportedByServer;
	}

	private _isAggregationSupportedByServer: boolean = false;
	get isAggregationSupportedByServer(): boolean {
		return this._isAggregationSupportedByServer;
	}
	set isAggregationSupportedByServer(isSupported: boolean) {
		this._isAggregationSupportedByServer = isSupported;
        
        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).isAggregationSupported = this.isAggregationSupportedByServer;
        }
	}

	private _enableJsonp: boolean = true;
	get enableJsonp(): boolean {
		return this._enableJsonp;
	}
	set enableJsonp(isEnabled: boolean) {
		this._enableJsonp = isEnabled;

        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).enableJsonp = this.enableJsonp;
        }
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

        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).provideFullCount = this.provideFullCount;
            this.queueAutoRefresh();
        }
    }

    private _provideOrderByParameter: (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => void = null;
    get provideOrderByParameter(): (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => void {
        return this._provideOrderByParameter;
    }
    set provideOrderByParameter(value: (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => void) {
        this._provideOrderByParameter = value;

        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).provideOrderByParameter = this.provideOrderByParameter;
            this.queueAutoRefresh();
        }
    }

    private _provideFilterParameter: (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => void = null;
    get provideFilterParameter(): (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => void {
        return this._provideFilterParameter;
    }
    set provideFilterParameter(value: (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => void) {
        this._provideFilterParameter = value;

        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).provideFilterParameter = this.provideFilterParameter;
            this.queueAutoRefresh();
        }
    }

    private _provideAggregationParameter: (args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => void = null;
    get provideAggregationParameter():(args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => void {
        return this._provideAggregationParameter;
    }
    set provideAggregationParameter(value: (args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => void) {
        this._provideAggregationParameter = value;

        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).provideAggregationParameter = this.provideAggregationParameter;
            this.queueAutoRefresh();
        }
    }

    private _provideAggregatedCount: (item: any) => number = null;
    get provideAggregatedCount():(item: any) => number {
        return this._provideAggregatedCount;
    }
    set provideAggregatedCount(value: (item: any) => number) {
        this._provideAggregatedCount = value;

        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).provideAggregatedCount = this.provideAggregatedCount;
            this.queueAutoRefresh();
        }
    }

    private _provideUri: (baseUri: string, entitySet: string, args: { name: string, value: any }[]) => string = null;
    get provideUri():(baseUri: string, entitySet: string, args: { name: string, value: any }[]) => string {
        return this._provideUri;
    }
    set provideUri(value: (baseUri: string, entitySet: string, args: { name: string, value: any }[]) => string) {
        this._provideUri = value;

        
        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).provideUri = this.provideUri;
            this.queueAutoRefresh();
        }
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

        
        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).performFetch = this.performFetch;
            this.queueAutoRefresh();
        }
    }

    private _providePagingParameter: (args: any[], skip: number, take: number) => void = null;
    get providePagingParameter():(args: any[], skip: number, take: number) => void {
        return this._providePagingParameter;
    }
    set providePagingParameter(value: (args: any[], skip: number, take: number) => void) {
        this._providePagingParameter = value;

        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).providePagingParameter = this.providePagingParameter;
            this.queueAutoRefresh();
        }
    }

    private _provideDesiredPropertiesParameter: (args: any[], selectString: string, desiredProperties: string[]) => void = null;
    get provideDesiredPropertiesParameter():(args: any[], selectString: string, desiredProperties: string[]) => void {
        return this._provideDesiredPropertiesParameter;
    }
    set provideDesiredPropertiesParameter(value: (args: any[], selectString: string, desiredProperties: string[]) => void) {
        this._provideDesiredPropertiesParameter = value;

        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).provideDesiredPropertiesParameter = this.provideDesiredPropertiesParameter;
            this.queueAutoRefresh();
        }
    }

    private _provideItems: (result: any) => any[];
    get provideItems():(result: any) => any[] {
        return this._provideItems;
    }
    set provideItems(value: (result: any) => any[]) {
        this._provideItems = value;

        if (this.actualDataProvider) {
            (<RestVirtualDataSourceDataProvider>this.actualDataProvider).provideItems = this.provideItems;
            this.queueAutoRefresh();
        }
    }

	public clone(): IDataSource {
		let dataSource = new RestVirtualDataSource();
		dataSource.executionContext = this.executionContext;
		dataSource.includeSummaryRowsInSection = this.includeSummaryRowsInSection;
		dataSource.isSectionCollapsable = this.isSectionCollapsable;
		dataSource.isSectionExpandedDefault = this.isSectionExpandedDefault;
		//dataSource.isSectionHeaderNormalRow = this.isSectionHeaderNormalRow;
		dataSource.isSectionSummaryRowsAtBottom = this.isSectionSummaryRowsAtBottom;
		//dataSource.isSectionContentVisible = this.isSectionContentVisible;
		dataSource.primaryKey = this.primaryKey;
		dataSource.propertiesRequested = this.propertiesRequested;
		dataSource.sectionHeaderDisplayMode = this.sectionHeaderDisplayMode;
		dataSource.shouldEmitSectionFooters = this.shouldEmitSectionFooters;
		dataSource.shouldEmitSectionHeaders = this.shouldEmitSectionHeaders;
		dataSource.shouldEmitShiftedRows = this.shouldEmitShiftedRows;
		dataSource.summaryScope = this.summaryScope;
		for (var i = 0; i < this.groupDescriptions.size(); i++)
		{
			dataSource.groupDescriptions.add(this.groupDescriptions.get(i));
		}
		for (var i = 0; i < this.sortDescriptions.size(); i++)
		{
			dataSource.sortDescriptions.add(this.sortDescriptions.get(i));
		}
		for (var i = 0; i < this.filterExpressions.size(); i++)
		{
			dataSource.filterExpressions.add(this.filterExpressions.get(i));
		}
		for (var i = 0; i < this.summaryDescriptions.size(); i++)
		{
			dataSource.summaryDescriptions.add(this.summaryDescriptions.get(i));
		}
		dataSource.pageSizeRequested = this.pageSizeRequested;
        	dataSource.maxCachedPages = this.maxCachedPages;
		dataSource.baseUri = this.baseUri;
		dataSource.entitySet = this.entitySet;
		dataSource.timeoutMilliseconds = this.timeoutMilliseconds;
		dataSource.isAggregationSupportedByServer = this.isAggregationSupportedByServer;
		dataSource.enableJsonp = this.enableJsonp;

        dataSource.fixedFullCount = this.fixedFullCount;
        dataSource.provideAggregationParameter = this.provideAggregationParameter;
        dataSource.provideAggregatedCount = this.provideAggregatedCount;
        dataSource.provideFilterParameter = this.provideFilterParameter;
        dataSource.provideFullCount = this.provideFullCount;
        dataSource.provideOrderByParameter = this.provideOrderByParameter;
        dataSource.provideUri = this.provideUri;
        dataSource.performFetch = this.performFetch;

        dataSource.providePagingParameter = this.providePagingParameter;
        dataSource.provideItems = this.provideItems;
        dataSource.provideDesiredPropertiesParameter = this.provideDesiredPropertiesParameter;
        

		return dataSource;
	}
}

