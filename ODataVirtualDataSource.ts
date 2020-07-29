import { VirtualDataSource } from "igniteui-core/VirtualDataSource";
import { ODataVirtualDataSourceDataProvider } from "./ODataVirtualDataSourceDataProvider";
import { IDataSource } from "igniteui-core/IDataSource";
import { BaseDataSource } from "igniteui-core/BaseDataSource";
import { Base, typeCast, Type, markType } from "igniteui-core/type";
import { IExternalDataSource } from 'igniteui-core/IExternalDataSource';

export class ODataVirtualDataSource extends VirtualDataSource implements IExternalDataSource {
	constructor() {
		super();
		this.dataProvider = ((() => {
			let $ret = new ODataVirtualDataSourceDataProvider();
			$ret.executionContext = this.executionContext;
			$ret.enableJsonp = this.enableJsonp;
			$ret.isAggregationSupported = this.isGroupingSupported;
			return $ret;
		})());
		this.externalDataSource = this;
		this.isReadOnly = true;
	}
	private onBaseUriChanged(oldValue: string, newValue: string): void {
		if (typeCast<ODataVirtualDataSourceDataProvider>((<any>ODataVirtualDataSourceDataProvider).$type, this.actualDataProvider) !== null) {
			(<ODataVirtualDataSourceDataProvider>this.actualDataProvider).baseUri = this.baseUri;
		}
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
			this.onBaseUriChanged(oldValue, this._baseUri);
		}
	}
	private onEntitySetChanged(oldValue: string, newValue: string): void {
		if (typeCast<ODataVirtualDataSourceDataProvider>((<any>ODataVirtualDataSourceDataProvider).$type, this.actualDataProvider) !== null) {
			(<ODataVirtualDataSourceDataProvider>this.actualDataProvider).entitySet = this.entitySet;
		}
		this.queueAutoRefresh();
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
		if (typeCast<ODataVirtualDataSourceDataProvider>((<any>ODataVirtualDataSourceDataProvider).$type, this.actualDataProvider) !== null) {
			(<ODataVirtualDataSourceDataProvider>this.actualDataProvider).timeoutMilliseconds = this.timeoutMilliseconds;
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
		if (typeCast<ODataVirtualDataSourceDataProvider>((<any>ODataVirtualDataSourceDataProvider).$type, this.actualDataProvider) !== null) {
			(<ODataVirtualDataSourceDataProvider>this.actualDataProvider).isAggregationSupported = isSupported;
		}
	}

	private _enableJsonp: boolean = true;
	get enableJsonp(): boolean {
		return this._enableJsonp;
	}
	set enableJsonp(isEnabled: boolean) {
		this._enableJsonp = isEnabled;
		if (typeCast<ODataVirtualDataSourceDataProvider>((<any>ODataVirtualDataSourceDataProvider).$type, this.actualDataProvider) !== null) {
			(<ODataVirtualDataSourceDataProvider>this.actualDataProvider).enableJsonp = isEnabled;
		}
	}

	public clone(): IDataSource {
		let dataSource = new ODataVirtualDataSource();
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
		return dataSource;
	}
}


