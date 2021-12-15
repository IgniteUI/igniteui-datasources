import { AsyncVirtualDataSourceProviderTaskDataHolder } from "igniteui-react-core";
import { Base, Type, markType } from "igniteui-react-core";

export class RestVirtualDataSourceProviderTaskDataHolder extends AsyncVirtualDataSourceProviderTaskDataHolder {
	static $t: Type = markType(RestVirtualDataSourceProviderTaskDataHolder, 'ODataVirtualDataSourceProviderTaskDataHolder', (<any>AsyncVirtualDataSourceProviderTaskDataHolder).$type);
}

