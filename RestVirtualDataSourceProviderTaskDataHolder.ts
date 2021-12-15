import { AsyncVirtualDataSourceProviderTaskDataHolder } from "igniteui-core/AsyncVirtualDataSourceProviderTaskDataHolder";
import { Base, Type, markType } from "igniteui-core/type";

export class RestVirtualDataSourceProviderTaskDataHolder extends AsyncVirtualDataSourceProviderTaskDataHolder {
	static $t: Type = markType(RestVirtualDataSourceProviderTaskDataHolder, 'ODataVirtualDataSourceProviderTaskDataHolder', (<any>AsyncVirtualDataSourceProviderTaskDataHolder).$type);
}

