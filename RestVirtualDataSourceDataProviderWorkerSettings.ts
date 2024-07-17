import { AsyncVirtualDataSourceDataProviderWorkerSettings } from "igniteui-core/AsyncVirtualDataSourceDataProviderWorkerSettings";
import { SortDescriptionCollection } from "igniteui-core/SortDescriptionCollection";
import { FilterExpressionCollection } from "igniteui-core/FilterExpressionCollection";
import { Base, Type, markType } from "igniteui-core/type";
import { SummaryDescriptionCollection } from 'igniteui-core/SummaryDescriptionCollection';
import { DataSourceSummaryScope } from 'igniteui-core/DataSourceSummaryScope';

export class RestVirtualDataSourceDataProviderWorkerSettings extends AsyncVirtualDataSourceDataProviderWorkerSettings {
	static $t: Type = markType(RestVirtualDataSourceDataProviderWorkerSettings, 'RestVirtualDataSourceDataProviderWorkerSettings', (<any>AsyncVirtualDataSourceDataProviderWorkerSettings).$type);
	private _baseUri: string = null;
	get baseUri(): string {
		return this._baseUri;
	}
	set baseUri(value: string) {
		this._baseUri = value;
	}
	private _entitySet: string = null;
	get entitySet(): string {
		return this._entitySet;
	}
	set entitySet(value: string) {
		this._entitySet = value;
	}
	private _sortDescriptions: SortDescriptionCollection = null;
	get sortDescriptions(): SortDescriptionCollection {
		return this._sortDescriptions;
	}
	set sortDescriptions(value: SortDescriptionCollection) {
		this._sortDescriptions = value;
	}
	private _filterExpressions: FilterExpressionCollection = null;
	get filterExpressions(): FilterExpressionCollection {
		return this._filterExpressions;
	}
	set filterExpressions(value: FilterExpressionCollection) {
		this._filterExpressions = value;
	}
	private _propertiesRequested: string[] = null;
	get propertiesRequested(): string[] {
		return this._propertiesRequested;
	}
	set propertiesRequested(value: string[]) {
		this._propertiesRequested = value;
	}
    private _schemaIncludedProperties: string[] = null;
    get schemaIncludedProperties(): string[] {
        return this._schemaIncludedProperties;
    }
    set schemaIncludedProperties(value: string[]) {
        this._schemaIncludedProperties = value;
    }
	private _groupDescriptions: SortDescriptionCollection = null;
	get groupDescriptions(): SortDescriptionCollection {
		return this._groupDescriptions;
	}
	set groupDescriptions(value: SortDescriptionCollection) {
		this._groupDescriptions = value;
	}

	private _summaryDescriptions: SummaryDescriptionCollection = null;
	get summaryDescriptions(): SummaryDescriptionCollection {
		return this._summaryDescriptions;
	}
	set summaryDescriptions(value: SummaryDescriptionCollection) {
		this._summaryDescriptions = value;
	}

	private _summaryscope: DataSourceSummaryScope;
	get summaryScope(): DataSourceSummaryScope {
		return this._summaryscope;
	}
	set summaryScope(value: DataSourceSummaryScope) {
		this._summaryscope = value;
	}

	private _enableJsonp: boolean;
	get enableJsonp(): boolean {
		return this._enableJsonp;
	}
	set enableJsonp(isEnabled: boolean) {
		this._enableJsonp = isEnabled;
	}

    

	private _isAggregationSupported: boolean;
	get isAggregationSupported(): boolean {
		return this._isAggregationSupported;
	}
	set isAggregationSupported(isSupported: boolean) {
		this._isAggregationSupported = isSupported;
	
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

    private _provideOrderByParameter: (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => any = null;
    get provideOrderByParameter(): (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => any {
        return this._provideOrderByParameter;
    }
    set provideOrderByParameter(value: (args: any[], orderByString: string, orderBy: SortDescriptionCollection) => any) {
        this._provideOrderByParameter = value;
    }

    private _provideFilterParameter: (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => any = null;
    get provideFilterParameter(): (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => any {
        return this._provideFilterParameter;
    }
    set provideFilterParameter(value: (args: any[], filterString: string, filterExpressions: FilterExpressionCollection) => any) {
        this._provideFilterParameter = value;
    }

    private _provideAggregationParameter: (args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => any = null;
    get provideAggregationParameter():(args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => any {
        return this._provideAggregationParameter;
    }
    set provideAggregationParameter(value: (args: any[], fetchCountOnly: boolean, groupByString: string, groupBy: SortDescriptionCollection, summaryString: string, summary: SummaryDescriptionCollection) => any) {
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
}

