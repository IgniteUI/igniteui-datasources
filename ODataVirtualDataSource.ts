import { VirtualDataSource } from "igniteui-core/VirtualDataSource";
import { ODataVirtualDataSourceDataProvider } from "./ODataVirtualDataSourceDataProvider";
import { BaseDataSource } from "igniteui-core/BaseDataSource";
import { Base, typeCast, Type, markType } from "igniteui-core/type";
import { IExternalDataSource } from 'igniteui-core/IExternalDataSource';

export class ODataVirtualDataSource extends VirtualDataSource {
	constructor() {
		super();
		this.dataProvider = ((() => {
			let $ret = new ODataVirtualDataSourceDataProvider();
			$ret.executionContext = this.executionContext;
			$ret.enableJsonp = this.enableJsonp;
			$ret.isAggregationSupported = this.isGroupingSupported;
			return $ret;
		})());
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
}


